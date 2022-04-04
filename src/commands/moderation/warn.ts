import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import {
  clearModLogForUser,
  insertModLog,
  deleteModLogEntries,
  getModLogForGuild,
  getModLogForUser,
} from '@database/statements';
import { parseMembers, strictGetUserId } from '@utils/argumentParsers';
import { getFallbackChannel } from '@utils/asyncMessageCollector';
import { getDiscordTimestamp, millisToDuration } from '@utils/datetime';
import {
  cleanEmbed,
  infoEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { userToMentionAndTag, joinNaturally } from '@utils/formatString';
import { isInChannelsOrCategories } from '@utils/guildUtils';
import { descriptionPaginator, fieldsPaginator } from '@utils/paginate';
import { pluralCount, pluralize } from '@utils/pluralize';
import { GuildBan, GuildMember } from 'discord.js';

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
    const addModLog = (userId: string) => {
      insertModLog({
        kind: 'warn',
        guildId: server.guild.id,
        userId,
        date,
        issuerId: message.author.id,
        messageLink: message.url,
        silent,
        content: restContent,
        duration: null,
      });
    };
    for (const member of members) {
      addModLog(member.id);
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
          `Logged the warning for ${joinNaturally(
            members.map((m) => m.toString())
          )} issued by ${
            message.author.tag
          }.\nThey did **not** receive the warning DM.`
        )
      );
    } else if (unreachableMembers.length) {
      if (unreachableMembers.length !== members.length) {
        await message.channel.send(
          successEmbed(
            `Successfully warned ${joinNaturally(
              members
                .filter((m) => !unreachableMembers.includes(m))
                .map((m) => m.toString())
            )} by ${message.author.tag}.`
          )
        );
      }

      await message.channel.send(
        warningEmbed(
          `Failed to DM ${unreachableMembers.join(
            ', '
          )}. They could not receive the warning.\n\n**Would you like me to send the warning ${
            server.config.userDMFallbackChannel
              ? `in <#${server.config.userDMFallbackChannel}> `
              : 'in a public channel '
          }and ping them?**`
        )
      );
      const fallbackChannel = await getFallbackChannel(message, server);
      if (fallbackChannel) {
        const fallback = await fallbackChannel.send(
          makeEmbed({
            content: `${unreachableMembers.join(
              ' '
            )} We could not send this warning as a DM because of your privacy settings. Contact the mods if you think this is a mistake.`,
            title: `You have been officially warned on ${server.guild.name}`,
            description: restContent,
            color: '#DB3C3C',
          })
        );
        await message.channel.send(
          successEmbed(
            `Successfully sent the message in ${fallbackChannel}.\n[Jump](${fallback.url})`
          )
        );
      } else {
        await message.channel.send(cleanEmbed(`Cancelled`));
      }
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
    if (!isInChannelsOrCategories(message, server.config.hiddenChannels))
      return;
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
        const fields = userModLogs.map((ml, index) => {
          const timestamp = getDiscordTimestamp(new Date(ml.date), 'D'); // TODO: 'f' to show time?
          const issuer = bot.users.cache.get(ml.issuerId);
          const issuerTag = issuer ? issuer.tag : `User: ${ml.issuerId}`;
          const jumpLink = ml.messageLink ? `\n[Jump](${ml.messageLink})` : '';
          const silent = ml.silent ? `Silent ` : '';
          let logTitle = '';
          switch (ml.kind) {
            case 'warn':
              logTitle = `\`${silent ? 'Silent Log' : 'Warning'}\`\n`;
              break;
            case 'mute':
              logTitle = `\`${silent}Timeout\` for ${
                ml.duration ? millisToDuration(ml.duration) : 'unknown'
              }\nReason: `;
              break;
            case 'voicemute':
              logTitle = `\`${silent}Voice Mute\`\nReason: `;
              break;
          }

          return {
            name: `${index + 1}: ${timestamp} by ${issuerTag}`,
            value: `${logTitle}${ml.content}${jumpLink}`,
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
          `\`${pluralCount('Official Warning', 's', officialWarningCount)}\``,
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
    'Clear warnings for a user. Unless it was a silent warning, the user will be notified.',
  arguments: '< @user > < all | warning numbers in the warnlog >',
  aliases: ['wc', 'unwarn'],
  examples: ['wc @Geralt all', 'unwarn 284840842026549259 1 3 7'],
  parentCommand: 'warn',
  normalCommand: async ({ content, message, server }) => {
    const { allIds, restContent } = parseMembers(content, server.guild);
    if (allIds.length !== 1) {
      throw new CommandArgumentError(
        `Please specify a user by either mentioning them or using their ID`
      );
    }

    const userId = allIds[0];
    const userModLogs = getModLogForUser({
      guildId: server.guild.id,
      userId: userId,
    });

    if (userModLogs.length === 0) {
      await message.channel.send(
        infoEmbed(`User <@${userId}> does not have any mod log entries`)
      );
      return;
    }

    const clearAll = restContent === 'all';
    const warningIndecies = clearAll ? userModLogs.map((_, i) => i + 1) : [];
    if (!clearAll) {
      const numbers = restContent.split(/\s+/);
      numbers.forEach((n) => {
        const logNumber = parseInt(n, 10);
        if (
          isNaN(logNumber) ||
          logNumber <= 0 ||
          logNumber > userModLogs.length
        ) {
          throw new CommandArgumentError(`Please specify valid log numbers`);
        }
        warningIndecies.push(logNumber);
      });
    }

    const member = server.guild.members.cache.get(userId);
    if (clearAll) {
      // All warn logs
      clearModLogForUser({
        guildId: server.guild.id,
        userId,
      });
    } else {
      deleteModLogEntries(
        {
          guildId: server.guild.id,
          userId,
        },
        warningIndecies
      );
    }

    const clearMessage = `Cleared ${pluralCount(
      'warning',
      's',
      warningIndecies.length
    )} for ${member || `User: ${userId}`}`;

    const warningsToNotify = userModLogs.filter(
      (ml, index) =>
        ml.kind === 'warn' && !ml.silent && warningIndecies.includes(index + 1)
    );
    if (member && warningsToNotify.length > 0) {
      const warningDates = warningsToNotify.map((w) =>
        getDiscordTimestamp(new Date(w.date))
      );

      try {
        await member.send(
          infoEmbed(
            `Your ${pluralize('warning', 's', warningsToNotify.length)} on "${
              server.guild.name
            }" from ${joinNaturally(warningDates)} ${
              (pluralize('', 'have', warningsToNotify.length), 'has')
            } been cleared.`
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
  },
};

export default [warn, warnlog, warnclear];
