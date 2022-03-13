import { GuildMember } from 'discord.js';
import { DiscordAPIError } from '@discordjs/rest';

import { BotCommand } from '@/types';
import Server from '@classes/Server';
import { millisToDuration } from '@utils/datetime';
import { successEmbed } from '@utils/embed';
import runAt from '@utils/runAt';
import { CommandArgumentError, ConflictError } from '@/errors';
import logger from '@/logger';

declare module '@/types' {
  interface ServerSchedule {
    selfMutes: Record<string, number>;
    scheduledSelfMutes: Record<string, { muteAt: number; unmuteAt: number }>;
  }
}

const TIME_REGEX = /([0-9]+d\s*)?([0-9]+h\s*)?([0-9]+m\s*)?([0-9]+s\s*)?/i;
const DAY_MILLIS = 86_400_000;

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
      delete server.schedule.selfMutes[userId];
      return;
    }
  }
  await func(member, server);
}

async function unmute(member: GuildMember, server: Server) {
  try {
    await member.roles.remove(server.config.selfMuteRoles);
    delete server.schedule.selfMutes[member.id];
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
    server.schedule.selfMutes[member.id] = unmuteAtMillis;
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
  server.schedule.scheduledSelfMutes[member.id] = {
    muteAt: muteAt.getTime(),
    unmuteAt: unmuteAt.getTime(),
  };
  runAt(muteAt, () => {
    getMemberOrRepeat(member.id, server, async (m, s) => {
      await mute(m, s, unmuteAt.getTime());
      delete server.schedule.scheduledSelfMutes[member.id];
    });
  });
}

function strToTime(str: string) {
  const match = str.match(TIME_REGEX);
  if (!match) {
    return 0;
  }
  const [days, hours, minutes, seconds] = match.map((s) => parseInt(s || '0'));
  const totalMillis =
    (seconds + minutes * 60 + hours * 3600 + days * 86400) * 1000;

  return totalMillis;
}

const command: BotCommand = {
  name: 'selfmute',
  aliases: ['sm'],
  description: 'Mute self for some amount of time',
  requiredServerConfigs: ['selfMuteRoles'],
  onCommandInit: (server) => {
    server.schedule.scheduledSelfMutes ||= {};
    server.schedule.selfMutes ||= {};

    Object.entries(server.schedule.scheduledSelfMutes).map(
      ([userId, schedule]) => {}
    );
    Object.entries(server.schedule.selfMutes).map(
      ([userId, unmuteAtMillis]) => {}
    );
  },
  normalCommand: async ({ message, commandContent, server }) => {
    setTimeout(() => message.delete(), 200);
    const existingSchedule =
      server.schedule.scheduledSelfMutes[message.member.id];
    if (existingSchedule) {
      // User already have scheduled mute
      throw new ConflictError(
        `You already have a scheduled self-mute in ${millisToDuration(
          existingSchedule.muteAt - new Date().getTime()
        )}`
      );
    }
    const [muteDuration, muteDelay] = commandContent.split('in');
    const totalMillis = strToTime(muteDuration);
    const delayMillis = muteDelay !== undefined ? strToTime(muteDelay) : null;
    if (!totalMillis) {
      throw new CommandArgumentError(
        `Specify the amount of time in the format \`1d2h3m4s\` Where d is days, h is hours, m is minutes, and s is seconds.`
      );
    }
    if (totalMillis > 3 * DAY_MILLIS) {
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
    } else if (delayMillis && delayMillis > DAY_MILLIS) {
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
