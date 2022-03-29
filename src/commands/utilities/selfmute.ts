import { GuildMember } from 'discord.js';

import { BotCommand } from '@/types';
import Server from '@classes/Server';
import { DAY_IN_MILLIS, millisToDuration, strToMillis } from '@utils/datetime';
import { successEmbed } from '@utils/embed';
import runAt, { getMemberOrRepeat } from '@utils/runAt';
import {
  CommandArgumentError,
  ConflictError,
  UserPermissionError,
} from '@/errors';
import logger from '@/logger';
import { safeDelete } from '@utils/safeDelete';

declare module '@/types' {
  interface ServerSchedules {
    selfMutes: Record<string, number>;
    scheduledSelfMutes: Record<string, { muteAt: number; unmuteAt: number }>;
  }
}

function removeSelfMute(userId: string, server: Server) {
  delete server.data.schedules.selfMutes[userId];
}

async function mute(
  member: GuildMember,
  server: Server,
  unmuteAtMillis: number
) {
  try {
    server.data.schedules.selfMutes[member.id] = unmuteAtMillis;
    await member.timeout(
      unmuteAtMillis - new Date().getTime(),
      'CIRI_SELFMUTE'
    );
    runAt(unmuteAtMillis, () => removeSelfMute(member.id, server));
  } catch (e) {
    delete server.data.schedules.selfMutes[member.id];
    // User left?
    logger.error(
      `Failed to self timeout in ${server.guild.name} for user ${member.id}`
    );
  }
}

function scheduleMute(
  member: GuildMember,
  server: Server,
  muteAtMillis: number,
  unmuteAtMillis: number
) {
  server.data.schedules.scheduledSelfMutes[member.id] = {
    muteAt: muteAtMillis,
    unmuteAt: unmuteAtMillis,
  };
  runAt(muteAtMillis, () => {
    getMemberOrRepeat(
      member.id,
      server,
      async (m, s) => {
        delete server.data.schedules.scheduledSelfMutes[member.id];
        await mute(m, s, unmuteAtMillis);
      },
      () => {
        delete server.data.schedules.scheduledSelfMutes[member.id];
        delete server.data.schedules.selfMutes[member.id];
      }
    );
  });
}

const command: BotCommand = {
  name: 'selfmute',
  aliases: ['sm'],
  description:
    'Mute yourself for some amount of time. The time can be specified with `d` for days, `h` for hours, `m` for minutes, and `s` for seconds. Use the `in` keyword to delay the selfmute by some amount of time.',
  arguments: '<mute duration> [in delay duration]',
  examples: ['sm 3h', 'sm 1d6h30m', 'sm 1d40m in 2h'],
  onCommandInit: (server) => {
    server.data.schedules.scheduledSelfMutes ||= {};
    server.data.schedules.selfMutes ||= {};

    Object.entries(server.data.schedules.scheduledSelfMutes).map(
      ([userId, schedule]) => {
        runAt(schedule.muteAt, () => {
          getMemberOrRepeat(
            userId,
            server,
            async (m, s) => {
              delete server.data.schedules.scheduledSelfMutes[userId];
              await mute(m, s, schedule.unmuteAt);
            },
            () => {
              delete server.data.schedules.scheduledSelfMutes[userId];
              delete server.data.schedules.selfMutes[userId];
            }
          );
        });
      }
    );
    Object.entries(server.data.schedules.selfMutes).map(
      ([userId, unmuteAtMillis]) => {
        runAt(unmuteAtMillis, () => {
          removeSelfMute(userId, server);
        });
      }
    );
  },
  normalCommand: async ({ message, content, server }) => {
    const existingSchedule =
      server.data.schedules.scheduledSelfMutes[message.member.id];
    if (existingSchedule) {
      // User already have scheduled mute
      throw new ConflictError(
        `You already have a scheduled self-mute in ${millisToDuration(
          existingSchedule.muteAt - new Date().getTime()
        )}`
      );
    }
    if (!message.member.moderatable) {
      throw new UserPermissionError('I cannot mute you');
    }
    const [muteDuration, muteDelay] = content.split(' in ');
    const totalMillis = strToMillis(muteDuration.trim()).millis;
    const delayMillis =
      muteDelay !== undefined ? strToMillis(muteDelay.trim()).millis : null;
    if (!totalMillis) {
      throw new CommandArgumentError(
        `Specify the amount of time in the format \`1d2h3m4s\` Where \`d\` is days, \`h\` is hours, \`m\` is minutes, and \`s\` is seconds.`
      );
    }
    if (totalMillis > 7 * DAY_IN_MILLIS) {
      throw new CommandArgumentError(
        `You cannot mute yourself for more than 7 days`
      );
    } else if (totalMillis < 60_000) {
      throw new CommandArgumentError(
        `You cannot mute yourself for under a minute`
      );
    }
    if (delayMillis === 0) {
      throw new CommandArgumentError(
        `Specify the amount of delay in the format \`1d2h3m4s\` Where d is days, h is hours, m is minutes, and s is seconds.`
      );
    } else if (delayMillis && delayMillis > DAY_IN_MILLIS) {
      throw new CommandArgumentError(`You cannot delay for more than a day`);
    }

    const muteAtMillis = delayMillis
      ? new Date().getTime() + delayMillis
      : null;

    safeDelete(message);
    if (muteAtMillis) {
      const unmuteAtMillis = muteAtMillis + totalMillis;
      scheduleMute(message.member, server, muteAtMillis, unmuteAtMillis);
      await message.channel.send(
        successEmbed({
          description: `${
            message.author
          } scheduled a self-mute of ${millisToDuration(
            totalMillis
          )} in ${millisToDuration(delayMillis)}`,
        })
      );
    } else {
      await mute(message.member, server, new Date().getTime() + totalMillis);
      await message.channel.send(
        successEmbed({
          description: `${message.author} self-muted for ${millisToDuration(
            totalMillis
          )}`,
        })
      );
    }
  },
};

export default command;
