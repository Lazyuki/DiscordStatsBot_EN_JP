import { GuildMember } from 'discord.js';
import { DiscordAPIError } from '@discordjs/rest';

import { BotCommand } from '@/types';
import Server from '@classes/Server';
import { DAY_IN_MILLIS, millisToDuration, strToTime } from '@utils/datetime';
import { successEmbed } from '@utils/embed';
import runAt from '@utils/runAt';
import { CommandArgumentError, ConflictError } from '@/errors';
import logger from '@/logger';

declare module '@/types' {
  interface ServerSchedules {
    selfMutes: Record<string, number>;
    scheduledSelfMutes: Record<string, { muteAt: number; unmuteAt: number }>;
  }
}

async function getMemberOrRepeat(
  userId: string,
  server: Server,
  func: (member: GuildMember, server: Server) => Promise<void>
) {
  let member = server.guild.members.cache.get(userId);
  if (!member) {
    try {
      member = await server.guild.members.fetch(userId);
    } catch (e) {
      const err = e as DiscordAPIError;
      if (err.code >= 500) {
        // Discord outage? Try again in 30 minutes
        runAt(new Date(new Date().getTime() + 30 * 60_000), () =>
          getMemberOrRepeat(userId, server, func)
        );
        return;
      }
      // User left? Remove self mutes
      delete server.data.schedules.selfMutes[userId];
      return;
    }
  }
  await func(member, server);
}

async function unmute(member: GuildMember, server: Server) {
  try {
    await member.roles.remove(server.config.selfMuteRoles);
    delete server.data.schedules.selfMutes[member.id];
  } catch (e) {
    // User left?
    logger.error(
      `Failed to remove self mute roles in ${server.guild.name} for user ${member.id}`
    );
  }
}

async function mute(
  member: GuildMember,
  server: Server,
  unmuteAtMillis: number
) {
  try {
    await member.roles.add(server.config.selfMuteRoles);
    server.data.schedules.selfMutes[member.id] = unmuteAtMillis;
    if (
      member.voice.channel &&
      server.guild.me?.permissions.has('MOVE_MEMBERS')
    ) {
      await member.voice.disconnect();
    }
    runAt(
      new Date(unmuteAtMillis),
      async () =>
        await getMemberOrRepeat(
          member.id,
          server,
          async (m, s) => await unmute(m, s)
        )
    );
  } catch (e) {
    // User left?
    logger.error(
      `Failed to add self mute roles in ${server.guild.name} for user ${member.id}`
    );
  }
}

function scheduleMute(
  member: GuildMember,
  server: Server,
  muteAt: Date,
  unmuteAt: Date
) {
  server.data.schedules.scheduledSelfMutes[member.id] = {
    muteAt: muteAt.getTime(),
    unmuteAt: unmuteAt.getTime(),
  };
  runAt(muteAt, () => {
    getMemberOrRepeat(member.id, server, async (m, s) => {
      await mute(m, s, unmuteAt.getTime());
      delete server.data.schedules.scheduledSelfMutes[member.id];
    });
  });
}

const command: BotCommand = {
  name: 'selfmute',
  aliases: ['sm'],
  description:
    'Mute yourself for some amount of time. The time can be specified with `d` for days, `h` for hours, `m` for minutes, and `s` for seconds. Use the `in` keyword to delay the selfmute by some amount of time.',
  requiredServerConfigs: ['selfMuteRoles'],
  requiredBotPermissions: ['MANAGE_ROLES'],
  arguments: '<mute duration> [in delay duration]',
  examples: ['sm 3h', 'sm 1d6h30m', 'sm 1d40m in 2h'],
  onCommandInit: (server) => {
    server.data.schedules.scheduledSelfMutes ||= {};
    server.data.schedules.selfMutes ||= {};

    Object.entries(server.data.schedules.scheduledSelfMutes).map(
      ([userId, schedule]) => {}
    );
    Object.entries(server.data.schedules.selfMutes).map(
      ([userId, unmuteAtMillis]) => {}
    );
  },
  normalCommand: async ({ message, content, server }) => {
    setTimeout(() => message.delete(), 200);
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
    const [muteDuration, muteDelay] = content.split(' in ');
    const totalMillis = strToTime(muteDuration.trim());
    const delayMillis =
      muteDelay !== undefined ? strToTime(muteDelay.trim()) : null;
    if (!totalMillis) {
      throw new CommandArgumentError(
        `Specify the amount of time in the format \`1d2h3m4s\` Where d is days, h is hours, m is minutes, and s is seconds.`
      );
    }
    if (totalMillis > 3 * DAY_IN_MILLIS) {
      throw new CommandArgumentError(
        `You cannot mute yourself for more than 3 days`
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

    const muteAt = delayMillis && new Date(new Date().getTime() + delayMillis);
    if (muteAt) {
      const unmuteAt = new Date(muteAt.getTime() + totalMillis);
      scheduleMute(message.member, server, muteAt, unmuteAt);
      await message.channel.send(
        successEmbed({
          description: `${
            message.author
          } scheduled a self-muted of ${millisToDuration(
            totalMillis
          )} in ${millisToDuration(delayMillis)}`,
        })
      );
    } else {
      const unmuteAt = new Date(new Date().getTime() + totalMillis);
      await mute(message.member, server, unmuteAt.getTime());
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
