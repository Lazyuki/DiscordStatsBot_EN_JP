import { CommandArgumentError, UserPermissionError } from '@/errors';
import { BotCommand } from '@/types';
import Server from '@classes/Server';
import { insertModLog } from '@database/statements';
import { parseMembers } from '@utils/argumentParsers';
import {
  waitForYesOrNo,
  getFallbackChannel,
} from '@utils/asyncMessageCollector';
import {
  DAY_IN_MILLIS,
  getDiscordTimestamp,
  HOUR_IN_MILLIS,
  millisToDuration,
  MINUTE_IN_MILLIS,
  strToMillis,
} from '@utils/datetime';
import {
  cleanEmbed,
  infoEmbed,
  makeEmbed,
  questionEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import {
  joinNaturally,
  userToMentionAndTag,
  userToTagAndId,
} from '@utils/formatString';
import { getTextChannel } from '@utils/guildUtils';
import runAt, { getMemberOrRepeat } from '@utils/runAt';
import { stripIndent } from 'common-tags';
import { GuildMember } from 'discord.js';

const DISCORD_TIMEOUT_MAX_DAYS = 28;

declare module '@/types' {
  interface ServerSchedules {
    multiTimeout: Record<string, number>; // userId to unmuteAtMillis
  }
}

// TODO: Use this if we ever want to timeout for more than 28 days
// Apply a new timeout every day so that the user's timer doesn't seem like it's running out soon.
function repeatTimeoutEveryDay(userId: string, server: Server) {
  runAt(new Date().getTime() + DAY_IN_MILLIS, () => {
    const unmuteAtMillis = server.data.schedules.multiTimeout[userId];
    if (!unmuteAtMillis) {
      // User's timeout removed
      return;
    }
    getMemberOrRepeat(userId, server, async (mem, ser) => {
      const now = new Date().getTime();
      const newTimeoutMillis = Math.min(
        unmuteAtMillis - now,
        DISCORD_TIMEOUT_MAX_DAYS * DAY_IN_MILLIS
      );
      if (newTimeoutMillis < DISCORD_TIMEOUT_MAX_DAYS * DAY_IN_MILLIS) {
        // No longer need to keep track of multi-timeout
        // This will be the last timeout
        delete server.data.schedules.multiTimeout[userId];
      }
      await mem.timeout(
        newTimeoutMillis,
        `CIRI_TIMEOUT_EXTENSION TIMEOUT_UNTIL:${unmuteAtMillis}`
      );
      repeatTimeoutEveryDay(userId, server);
    });
  });
}

const mute: BotCommand = {
  name: 'mute',
  aliases: ['timeout', 'tempmute', 'tm'],
  isAllowed: ['MODERATE_MEMBERS', 'MINIMO'],
  requiredBotPermissions: ['MODERATE_MEMBERS'],
  description:
    "Mute (timeout) people from chats and VC using Discord's timeout feature",
  arguments:
    '<@user> [@user2...] [time in the format 1d2h3m4s. Default: 5m. Max: 28d] [reason]',
  childCommands: ['unmute'],
  examples: [
    'timeout @Geralt being too good at Japanese',
    'timeout 284840842026549259 299335689558949888 shut up',
  ],
  onCommandInit: (server) => {
    server.data.schedules.multiTimeout ||= {};
    Object.entries(server.data.schedules.multiTimeout).forEach(
      ([userId, unmuteAtMillis]) => {
        const now = new Date().getTime();
        if (unmuteAtMillis < now) {
          // should be unmuted in the past
          delete server.data.schedules.multiTimeout[userId];
        } else {
          repeatTimeoutEveryDay(userId, server);
        }
      }
    );
  },
  normalCommand: async ({ content, message, server }) => {
    const firstArgument = content.split(' ')[0];
    let timeoutMillis = 0;
    const firstArgTime = strToMillis(firstArgument);
    if (firstArgTime.millis > 0) {
      timeoutMillis = firstArgTime.millis;
      content = content.split(' ').slice(1).join(' ');
    }

    const { members, restContent } = parseMembers(content, server.guild);
    let reason = restContent;
    if (!timeoutMillis) {
      const firstRestArgument = restContent.split(' ')[0];
      const firstRestTime = strToMillis(firstRestArgument);
      if (firstRestTime.millis > 0) {
        timeoutMillis = firstRestTime.millis;
        reason = restContent.split(' ').slice(1).join(' ');
      }
    }
    if (!timeoutMillis) {
      // Default 5 minute timeout
      timeoutMillis = 5 * MINUTE_IN_MILLIS;
    }
    if (!reason) reason = 'Unspecified';

    if (timeoutMillis > DISCORD_TIMEOUT_MAX_DAYS * DAY_IN_MILLIS) {
      throw new CommandArgumentError(
        `You can only timeout users for ${DISCORD_TIMEOUT_MAX_DAYS} days.`
      );
    }
    if (
      timeoutMillis > 24 * HOUR_IN_MILLIS &&
      !message.member.permissions.has('MODERATE_MEMBERS')
    ) {
      // MINIMOs can only mute for 24 hours
      throw new UserPermissionError(
        `You do not have permission to mute users for over 24 hours`
      );
    }

    if (!members.every((m) => m.moderatable)) {
      throw new UserPermissionError(
        `I cannot mute them as their roles are heigher than mine`
      );
    }

    // Discord Timeout only allows 28 days max so Ciri has to re-apply the timeout every time it runs out.
    const multiTimeout =
      timeoutMillis > DISCORD_TIMEOUT_MAX_DAYS * DAY_IN_MILLIS;
    const unmuteAt = new Date(new Date().getTime() + timeoutMillis);

    const durationString = stripIndent`
    \`${millisToDuration(timeoutMillis)}\`

    Unmuting at: ${getDiscordTimestamp(
      unmuteAt,
      'F'
    )} (in ${getDiscordTimestamp(unmuteAt, 'R')}) 
    `;
    const multiTimeoutWarning = multiTimeout
      ? "⚠️ Due to Discord's Timeout being limited to 28 days, the remaining time on the UI will NOT be accurate until you have 28 days remaining."
      : '';

    let auditLogReason = `CIRI_TIMEOUT by ${userToTagAndId(message.author)}${
      multiTimeout ? ` TIMEOUT_UNTIL:${unmuteAt.getTime()}` : ''
    } Reason: ${reason}`;
    if (auditLogReason.length > 512) {
      await message.channel.send(
        warningEmbed(
          `The timeout reason exceeds the limit of 512 characters: \`${auditLogReason.length}\` characters.\n\nDo you want to send the full reason to the person and let Discord's audit log timeout reason be truncated?`
        )
      );
      const sendAnyway = await waitForYesOrNo(message);
      if (!sendAnyway) return;
      auditLogReason = auditLogReason.slice(0, 512);
    }

    const noDMs: GuildMember[] = [];
    const timeoutDMembed = makeEmbed({
      color: 'RED',
      title: `You are now on timeout in the "${server.guild.name}" server`,
      fields: [
        {
          name: 'Duration',
          value: `${durationString}\n${multiTimeoutWarning}`,
          inline: false,
        },
        {
          name: 'Reason',
          value: reason,
          inline: false,
        },
      ],
      footer: 'Contact one of the mods if you need to discuss this issue.',
    });
    const date = new Date().toISOString();
    const addModLog = (userId: string) => {
      insertModLog({
        kind: 'mute',
        guildId: server.guild.id,
        userId,
        date,
        issuerId: message.author.id,
        messageLink: message.url,
        silent: false,
        content: reason,
        duration: timeoutMillis,
      });
    };
    for (const member of members) {
      await member.timeout(timeoutMillis, auditLogReason);
      addModLog(member.id);
      if (multiTimeout) {
        server.data.schedules.multiTimeout[member.id] = unmuteAt.getTime();
        repeatTimeoutEveryDay(member.id, server);
      }
      try {
        await member.send(timeoutDMembed);
      } catch (e) {
        noDMs.push(member);
      }
    }

    if (noDMs.length === 0) {
      await message.channel.send(
        successEmbed(
          `Successfully timed out ${joinNaturally(
            members.map((m) => m.toString())
          )} and DMed them the reason`
        )
      );
    } else {
      const failedAllDMs = noDMs.length === members.length;
      const fallbackSuggestion = `\n\n**️Would you like me to send the reason ${
        server.config.userDMFallbackChannel
          ? `in <#${server.config.userDMFallbackChannel}> `
          : 'in a public channel '
      }and ping them?**`;
      const dmInfo = failedAllDMs
        ? 'but failed to DM the reason to them.' + fallbackSuggestion
        : `and DMed them except for ${joinNaturally(
            noDMs.map((m) => m.toString())
          )}.` + fallbackSuggestion;
      await message.channel.send(
        warningEmbed(
          `Successfully timed out ${joinNaturally(
            members.map((m) => m.toString())
          )} ${dmInfo}`
        )
      );
      const fallbackChannel = await getFallbackChannel(message, server);
      if (fallbackChannel) {
        const fallback = await fallbackChannel.send({
          ...timeoutDMembed,
          content: `${noDMs.join(
            ' '
          )}\nWe could not send this message as a DM because of your privacy settings. Contact the mods if you think this is a mistake.`,
        });
        await message.channel.send(
          successEmbed(
            `Successfully sent the message in ${fallbackChannel}.\n[Jump](${fallback.url})`
          )
        );
      } else {
        await message.channel.send(cleanEmbed(`Cancelled`));
      }
    }
    if (server.config.modActionLogChannel) {
      const modChannel = getTextChannel(
        server.guild,
        server.config.modActionLogChannel
      );
      await modChannel?.send(
        makeEmbed({
          title: `Timeout`,
          fields: [
            {
              name: 'Timed Out Users',
              value: members
                .map((m) => `${userToMentionAndTag(m.user)}`)
                .join('\n'),
              inline: false,
            },
            {
              name: 'Duration',
              value: durationString,
              inline: false,
            },
            {
              name: 'Reason',
              value: reason,
              inline: false,
            },
          ],
          footer: `By ${message.author.tag} in #${message.channel.name}`,
          footerIcon: message.member.displayAvatarURL(),
          timestamp: true,
        })
      );
    }
  },
};

const unmute: BotCommand = {
  name: 'unmute',
  isAllowed: ['MODERATE_MEMBERS'],
  requiredBotPermissions: ['MODERATE_MEMBERS'],
  description: 'Remove timeout from people',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'uto @Geralt you are good now',
    'uto 284840842026549259 299335689558949888 apologized',
  ],
  parentCommand: 'mute',
  normalCommand: async ({ content, message, server }) => {
    const { members, restContent } = parseMembers(
      content,
      server.guild,
      'MEMBERS'
    );
    const reason = restContent || 'Unspecified';
    const noDMs: GuildMember[] = [];
    const selfmutes: GuildMember[] = [];
    const now = new Date().getTime();
    if (!members.every((m) => m.moderatable)) {
      throw new CommandArgumentError(
        'Some members are not `moderatable` by me'
      );
    }
    for (const member of members) {
      const selfmute = server.data.schedules.selfMutes[member.id];
      if (selfmute) {
        await message.channel.send(
          questionEmbed(
            `Remove ${member}'s self mute that ends in ${millisToDuration(
              selfmute - now
            )}?`
          )
        );
        const yes = await waitForYesOrNo(message);
        if (yes) {
          await member.timeout(
            null,
            `CIRI_SELFMUTE_REMOVE By ${userToTagAndId(
              message.author
            )} Reason: ${reason}`
          );
          delete server.data.schedules.selfMutes[member.id];
          await message.channel.send(
            successEmbed(`Removed ${member}'s selfmute`)
          );
        } else {
          await message.channel.send(infoEmbed(`Skipped ${member}`));
        }
        selfmutes.push(member);
      } else {
        delete server.data.schedules.multiTimeout[member.id];
        await member.timeout(
          null,
          `CIRI_REMOVE_TIMEOUT By ${userToTagAndId(
            message.author
          )} Reason: ${reason}`
        );
        try {
          await member.send(
            makeEmbed({
              color: 'RED',
              title: `Your timeout has been removed in the "${server.guild.name}" server`,
              description: `Reason: ${reason}`,
            })
          );
        } catch (e) {
          noDMs.push(member);
        }
      }
    }
    if (selfmutes.length === members.length) {
      return;
    }

    const untimeoutMembers = members.filter((m) => !selfmutes.includes(m));
    const failedAllDMs = noDMs.length === untimeoutMembers.length;
    const dmInfo = failedAllDMs
      ? 'but failed to notify them'
      : noDMs.length
      ? `and DMed them except for ${joinNaturally(
          noDMs.map((m) => m.toString())
        )}`
      : 'and DMed them';
    await message.channel.send(
      successEmbed(
        `Successfully removed the timeout for ${joinNaturally(
          untimeoutMembers.map((m) => m.toString())
        )} ${dmInfo}`
      )
    );
    if (server.config.modActionLogChannel) {
      const modChannel = getTextChannel(
        server.guild,
        server.config.modActionLogChannel
      );
      await modChannel?.send(
        makeEmbed({
          title: `Remove Timeout`,
          fields: [
            {
              name: 'Unmuted Users',
              value: untimeoutMembers
                .map((m) => `${userToMentionAndTag(m.user)}`)
                .join('\n'),
              inline: false,
            },
            {
              name: 'Reason',
              value: reason,
              inline: false,
            },
          ],
          footer: `By ${message.author.tag} in #${message.channel.name}`,
          footerIcon: message.member.displayAvatarURL(),
          timestamp: true,
        })
      );
    }
  },
};

export default [mute, unmute];
