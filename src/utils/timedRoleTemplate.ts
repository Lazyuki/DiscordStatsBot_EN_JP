import { GuildMember, escapeMarkdown } from 'discord.js';

import { BotCommand } from '@/types';
import Server from '@classes/Server';
import { DAY_IN_MILLIS, millisToDuration, strToMillis } from '@utils/datetime';
import { infoEmbed, successEmbed } from '@utils/embed';
import runAt, { getMemberOrRepeat } from '@utils/runAt';
import {
  CommandArgumentError,
  ConflictError,
  UserPermissionError,
} from '@/errors';
import logger from '@/logger';
import { safeDelete } from '@utils/safeDelete';
import { getTextChannel } from '@utils/guildUtils';

declare module '@/types' {
  interface ServerSchedules {
    // key is userId-roleId
    selfRoles: Record<string, number>;
    scheduledSelfRoles: Record<
      string,
      { assignAt: number; unassignAt: number; channelId: string }
    >;
  }
}

function getSelfRoleKey(userId: string, roleId: string) {
  return `${userId}-${roleId}`;
}

function removeSelfRole(selfRoleKey: string, server: Server) {
  delete server.data.schedules.selfRoles[selfRoleKey];
  const [userId, roleId] = selfRoleKey.split('-');
  const member = server.guild.members.cache.get(userId);
  if (member) {
    member.roles.remove(roleId);
  }
}

async function assignRole(
  member: GuildMember,
  roleId: string,
  server: Server,
  removeAtMillis: number
) {
  const id = getSelfRoleKey(member.id, roleId);
  try {
    server.data.schedules.selfRoles[id] = removeAtMillis;
    await member.roles.add(roleId, 'CIRI_SELF_ROLE');
    runAt(removeAtMillis, () => removeSelfRole(id, server));
  } catch (e) {
    delete server.data.schedules.selfRoles[id];
    // User left?
    logger.error(
      `Failed to self role in ${server.guild.name} for user ${member.id}`
    );
  }
}

function scheduleSelfRole(
  member: GuildMember,
  roleId: string,
  server: Server,
  channelId: string,
  assignAtMillis: number,
  unassignAtMillis: number
) {
  const id = getSelfRoleKey(member.id, roleId);
  server.data.schedules.scheduledSelfRoles[id] = {
    assignAt: assignAtMillis,
    unassignAt: unassignAtMillis,
    channelId,
  };
  runAt(assignAtMillis, () => {
    getMemberOrRepeat(
      member.id,
      server,
      async (m, s) => {
        delete server.data.schedules.scheduledSelfRoles[id];
        await assignRole(m, roleId, s, unassignAtMillis);
        const channel = getTextChannel(server.guild, channelId);
        await channel?.send(
          infoEmbed(
            `${m} self-assigned <@&${roleId}>for **${millisToDuration(
              unassignAtMillis - assignAtMillis
            )}** as scheduled.`
          )
        );
      },
      () => {
        delete server.data.schedules.scheduledSelfRoles[id];
        delete server.data.schedules.selfRoles[id];
      }
    );
  });
}

type TemplateBotCommand = Omit<
  BotCommand,
  'name' | 'aliases' | 'description' | 'examples'
>;

export const timedRoleCommandTemplate: TemplateBotCommand = {
  requiredBotPermissions: ['ModerateMembers', 'ManageRoles'],
  arguments: '< role_duration (Max: 7d)> [ in delay_duration (Max: 1d)]',
  onCommandInit: (server) => {
    server.data.schedules.scheduledSelfRoles ||= {};
    server.data.schedules.selfRoles ||= {};

    Object.entries(server.data.schedules.scheduledSelfRoles).map(
      ([selfRoleKey, schedule]) => {
        const [userId, roleId] = selfRoleKey.split('-');
        runAt(schedule.assignAt, () => {
          getMemberOrRepeat(
            userId,
            server,
            async (m, s) => {
              delete server.data.schedules.scheduledSelfRoles[selfRoleKey];
              await assignRole(m, roleId, s, schedule.unassignAt);
              const channel = getTextChannel(server.guild, schedule.channelId);
              await channel?.send(
                infoEmbed(
                  `${m} self-assigned <@&${roleId} for **${millisToDuration(
                    schedule.unassignAt - schedule.assignAt
                  )}** as scheduled.`
                )
              );
            },
            () => {
              delete server.data.schedules.scheduledSelfRoles[userId];
              delete server.data.schedules.selfRoles[userId];
            }
          );
        });
      }
    );
    Object.entries(server.data.schedules.selfRoles).map(
      ([selfRoleKey, unassignAtMillis]) => {
        runAt(unassignAtMillis, () => {
          removeSelfRole(selfRoleKey, server);
        });
      }
    );
  },
};

export const getNormalCommandForRole: (
  roleId: string
) => BotCommand['normalCommand'] =
  (roleId: string) =>
  async ({ message, content, server }) => {
    const selfRoleKey = getSelfRoleKey(message.member.id, roleId);
    const existingSchedule =
      server.data.schedules.scheduledSelfRoles[selfRoleKey];
    if (existingSchedule) {
      // User already have scheduled mute
      throw new ConflictError(
        `You already have a scheduled self-role in ${millisToDuration(
          existingSchedule.assignAt - new Date().getTime()
        )}`
      );
    }
    const [roleDuration, roleDelay] = content.split(' in ');
    const totalMillis = strToMillis(roleDuration.trim()).millis;
    const delayMillis =
      roleDelay !== undefined ? strToMillis(roleDelay.trim()).millis : null;
    if (!totalMillis) {
      throw new CommandArgumentError(
        `Specify the amount of time in the format \`1d2h3m4s\` Where \`d\` is days, \`h\` is hours, \`m\` is minutes, and \`s\` is seconds.`
      );
    }
    if (totalMillis > 7 * DAY_IN_MILLIS) {
      throw new CommandArgumentError(
        `You cannot assign a role to yourself for more than 7 days`
      );
    } else if (totalMillis < 60_000) {
      throw new CommandArgumentError(
        `You cannot assign a role to yourself for under a minute`
      );
    }
    if (
      delayMillis === 0 ||
      (roleDelay === undefined && content.includes(' in'))
    ) {
      throw new CommandArgumentError(
        `Specify the amount of delay in the format \`1d2h3m4s\` Where d is days, h is hours, m is minutes, and s is seconds.`
      );
    } else if (delayMillis && delayMillis > DAY_IN_MILLIS) {
      throw new CommandArgumentError(`You cannot delay for more than a day`);
    }

    const assignAtMillis = delayMillis
      ? new Date().getTime() + delayMillis
      : null;

    safeDelete(message);
    const name = `**${escapeMarkdown(message.member.displayName)}**`;
    if (assignAtMillis) {
      const unassignAtMillis = assignAtMillis + totalMillis;
      scheduleSelfRole(
        message.member,
        roleId,
        server,
        message.channel.id,
        assignAtMillis,
        unassignAtMillis
      );
      await message.channel.send(
        successEmbed({
          description: `${name} scheduled a self-role <@&${roleId}>  of **${millisToDuration(
            totalMillis
          )}** in ${millisToDuration(delayMillis)}`,
        })
      );
    } else {
      await assignRole(
        message.member,
        roleId,
        server,
        new Date().getTime() + totalMillis
      );
      await message.channel.send(
        successEmbed({
          description: `${name} self-assigned <@&${roleId}> for **${millisToDuration(
            totalMillis
          )}**`,
        })
      );
    }
  };
