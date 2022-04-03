import { CommandArgumentError } from '@/errors';
import { BotCommand, ModLogEntry } from '@/types';
import {
  clearModLogForUser,
  insertModLog,
  deleteModLogEntry,
  getModLogForGuild,
  getModLogForUser,
} from '@database/statements';
import { parseMembers, strictGetUserId } from '@utils/argumentParsers';
import { getFallbackChannel } from '@utils/asyncMessageCollector';
import { getDiscordTimestamp } from '@utils/datetime';
import { infoEmbed, makeEmbed, successEmbed, warningEmbed } from '@utils/embed';
import { userToMentionAndTag } from '@utils/formatString';
import { descriptionPaginator, fieldsPaginator } from '@utils/paginate';
import { pluralCount, pluralize } from '@utils/pluralize';
import { GuildBan, GuildMember } from 'discord.js';

export function addModLog(entry: ModLogEntry) {
  insertModLog(entry);
}

const warn: BotCommand = {
  name: 'warn',
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description:
    'Warn people and add it to the warnlog entries. Use `{PREFIX}log` instead to silently log the warning without messaging, or use `{PREFIX}message` to send a DM without making it a warning',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'warn @Geralt being too good at Japanese',
    'warn 1234566789123456789 1234566789123456789 shut up',
    'log 1234566789123456789 unconfirmed report of being loud',
  ],
  options: [
    {
      name: 'silent',
      short: 's',
      bool: true,
      description:
        'Aliased to `{PREFIX}log`. Do **NOT** DM the warning to the user, but keep the log in `warnlog`',
    },
  ],
  childCommands: ['warnlog', 'warnclear'],
  normalCommand: async ({ content, message, server, options }) => {
    const { members, restContent } = parseMembers(
      content,
      server.guild,
      'MEMBERS'
    );
    if (!restContent) {
      throw new CommandArgumentError('Please specify the warning content');
    }
    const date = new Date().toISOString();
    const silent = Boolean(options['silent']);
    const unreachableMembers: GuildMember[] = [];
    for (const member of members) {
      const warning: ModLogEntry = {
        kind: 'warn',
        guildId: server.guild.id,
        userId: member.id,
        date,
        issuerId: message.author.id,
        messageLink: message.url,
        silent,
        content: restContent,
      };
      addModLog(warning);
      if (!silent) {
        try {
          await member.send(
            makeEmbed({
              title: `You have been officially warned on ${server.guild.name}`,
              description: restContent,
              color: '#DB3C3C',
            })
          );
        } catch (e) {
          unreachableMembers.push(member);
        }
      }
    }
    if (silent) {
      await message.channel.send(
        successEmbed(
          `Logged the warning for ${members.join(', ')} issued by ${
            message.author.tag
          }. They did not receive the warning.`
        )
      );
    } else if (unreachableMembers.length) {
      if (unreachableMembers.length !== members.length) {
        await message.channel.send(
          successEmbed(
            `Successfully warned ${members
              .filter((m) => !unreachableMembers.includes(m))
              .join(', ')} by ${message.author.tag}.`
          )
        );
      }

      await message.channel.send(
        warningEmbed(
          `Failed to DM ${unreachableMembers.join(
            ', '
          )}. They could not receive the warning.\n\n⚠️Would you like me to send the warning ${
            server.config.userDMFallbackChannel
              ? `in <#${server.config.userDMFallbackChannel}> `
              : 'in a public channel '
          }and ping them?`
        )
      );
      const fallbackChannel = await getFallbackChannel(message, server);
      await fallbackChannel?.send(
        makeEmbed({
          content: `${unreachableMembers.join(
            ' '
          )} We could not send this warning as a DM because of your privacy settings. Contact the mods if you think this is a mistake.`,
          title: `You have been officially warned on ${server.guild.name}`,
          description: restContent,
          color: '#DB3C3C',
        })
      );
    } else {
      await message.channel.send(
        successEmbed(
          `Successfully warned ${members.join(', ')} by ${message.author.tag}.`
        )
      );
    }
  },
};

const warnlog: BotCommand = {
  name: 'warnlog',
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description:
    'List mod logs. To prevent accidentally showing warning details publically, this command is only available in one of `hiddenChannels` defined in the `config` command.',
  arguments: '[@user]',
  aliases: ['wl', 'ml', 'modlog'],
  examples: ['wl', 'wl 284840842026549259'],
  parentCommand: 'warn',
  normalCommand: async ({ bot, content, message, server }) => {
    if (content) {
      const userId = strictGetUserId(content, server.guild);
      if (!userId) {
        throw new CommandArgumentError(
          `Please specify a user by either mentioning them or using their ID`
        );
      }
      const userModLogs = getModLogForUser({
        guildId: server.guild.id,
        userId,
      });
      let guildBan: GuildBan | undefined;
      try {
        guildBan = await server.guild.bans.fetch(userId);
      } catch {}
      const user = bot.users.cache.get(userId);
      const userMentionTag = user
        ? userToMentionAndTag(user)
        : `User: ${userId}`;

      const isWatched = server.temp.watched.includes(userId);

      if (userModLogs.length === 0) {
        await message.channel.send(
          infoEmbed({
            description: `No mod log entries found for ${userMentionTag}${
              isWatched
                ? ' but they are being watched for deleted messages'
                : ''
            }`,
            fields: guildBan
              ? [
                  {
                    name: 'User Banned',
                    value: guildBan.reason || 'Reason: Unspecified',
                  },
                ]
              : undefined,
          })
        );
      } else {
        const fields = userModLogs.map((ml) => {
          const timestamp = getDiscordTimestamp(new Date(ml.date), 'D'); // TODO: 'f' to show time?
          const issuer = bot.users.cache.get(ml.issuerId);
          const issuerTag = issuer ? issuer.tag : `User: ${ml.issuerId}`;
          const jumpLink = ml.messageLink ? `[Jump](${ml.messageLink})\n` : '';
          const silent = ml.silent ? `(**Silently Logged**)\n` : '';

          return {
            name: `${timestamp} by ${issuerTag}`,
            value: `${jumpLink}${silent}${ml.content}`,
          };
        });

        // Add ban log
        if (guildBan) {
          fields.unshift({
            name: 'User Banned',
            value: guildBan.reason || 'Reason: Unspecified',
          });
        }

        const officialWarningCount = userModLogs.reduce(
          (total, modLog) =>
            modLog.kind === 'warn' && !modLog.silent ? total + 1 : total,
          0
        );
        const userTag = user ? user.tag : `User: ${userId}`;

        await fieldsPaginator(
          message.channel,
          `Mod Logs for ${userTag}${
            isWatched ? ' (Being watched for deleted messages)' : ''
          }`,
          pluralCount('Official Warning', 's', officialWarningCount),
          fields,
          false,
          -1,
          message.author.id
        );
      }
    } else {
      // Paginated warn logs
      const allModLogs = getModLogForGuild({ guildId: server.guild.id });

      await descriptionPaginator(
        message.channel,
        `All Warn Logs (${allModLogs.length} users)`,
        allModLogs.map((ml) => {
          const user = bot.users.cache.get(ml.userId);

          return `${user ? userToMentionAndTag(user) : `User: ${ml.userId}`}: ${
            ml.count
          }`;
        }),
        20,
        ''
      );
    }
  },
};

const warnclear: BotCommand = {
  name: 'warnclear',
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description:
    'Clear a warning or all warnings for a user. Unless it was a silent warning, the user will be notified.',
  arguments: '<@user> <all | warning number in warnlog>',
  aliases: ['wc', 'unwarn'],
  examples: ['wc @Geralt all', 'unwarn 284840842026549259 3'],
  parentCommand: 'warn',
  normalCommand: async ({ content, message, server }) => {
    const { allIds, restContent } = parseMembers(content, server.guild);
    if (allIds.length !== 1) {
      throw new CommandArgumentError(
        `Please specify a user by either mentioning them or using their ID`
      );
    }
    const clearAll = restContent === 'all';
    const logNumber = parseInt(restContent, 10);
    if (!clearAll && isNaN(logNumber)) {
      throw new CommandArgumentError(
        `Please specify which logs to clear, either by using the log number in \`${server.config.prefix}modlog\` or \`all\` to clear all.`
      );
    }
    const userId = allIds[0];
    const userModLogs =
      getModLogForUser({
        guildId: server.guild.id,
        userId: userId,
      }) || [];

    if (userModLogs.length === 0) {
      await message.channel.send(
        infoEmbed(`User <@${userId}> does not have any mod log entries`)
      );
      return;
    }
    const member = server.guild.members.cache.get(userId);
    const clearedWarnings: ModLogEntry[] = [];
    if (clearAll) {
      // All warn logs
      clearModLogForUser({
        guildId: server.guild.id,
        userId,
      });
      const clearMessage = `Cleared ${pluralize(
        'warning',
        's',
        userModLogs.length
      )}`;
      if (
        member &&
        userModLogs.some((ml) => ml.kind === 'warn' && !ml.silent)
      ) {
        // If it contains actual warnings
        try {
          await member.send(
            infoEmbed(
              `Your warnings on "${server.guild.name}" have been cleared.`
            )
          );
          await message.channel.send(
            successEmbed(`${clearMessage} and they have been notified`)
          );
        } catch (e) {
          await message.channel.send(
            warningEmbed(`${clearMessage} but failed to notify them.`)
          );
        }
      } else {
        await message.channel.send(successEmbed(clearMessage));
      }
    } else {
      if (logNumber < 1 || logNumber > userModLogs.length) {
        throw new CommandArgumentError(
          `The mod log number \`${logNumber}\` does not exist on <@${userId}>`
        );
      }
      deleteModLogEntry({
        guildId: server.guild.id,
        userId,
        index: logNumber - 1,
      });
    }
  },
};

export default [warn, warnlog, warnclear];
