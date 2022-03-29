import { CommandArgumentError } from '@/errors';
import { BotCommand, ModLogEntry } from '@/types';
import { REGEX_RAW_ID, REGEX_USER } from '@/utils/regex';
import {
  clearModLogForUser,
  insertModLog,
  deleteModLogEntry,
  getModLogForGuild,
  getModLogForUser,
} from '@database/statements';
import { parseMembers } from '@utils/argumentParsers';
import {
  waitForYesOrNo,
  getFallbackChannel,
} from '@utils/asyncMessageCollector';
import { BOT_CHANNEL, DM_MOD_BOT, EJLX } from '@utils/constants';
import {
  errorEmbed,
  infoEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { getTextChannel } from '@utils/guildUtils';
import { descriptionPaginator } from '@utils/paginate';
import { pluralize } from '@utils/pluralize';
import { GuildMember } from 'discord.js';

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
    'warn 284840842026549259 299335689558949888 shut up',
    'warn -m 284840842026549259 Friendly reminder that you need to chillax',
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
    const { members, restContent } = parseMembers(content, server.guild);
    if (members.length === 0) {
      throw new CommandArgumentError('Please specify users');
    }
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
  description: 'List mod logs',
  arguments: '[@user]',
  aliases: ['wl', 'modlog', 'ml'],
  examples: ['wl', 'wl 284840842026549259'],
  parentCommand: 'warn',
  normalCommand: async ({ bot, content, message, server }) => {
    if (content) {
      const userId = content.match(REGEX_RAW_ID)?.[0];
      if (!userId) {
        throw new CommandArgumentError(
          `Please specify a user by either mentioning them or using their ID`
        );
      }
      const guildBan = server.guild.bans.cache.get(userId);
      const userModLogs = getModLogForUser({
        guildId: server.guild.id,
        userId,
      });
      if (userModLogs.length === 0) {
        await message.channel.send(successEmbed('No mod log entries found.'));
      } else {
        await descriptionPaginator(
          message.channel,
          'Mod Logs for ',
          userModLogs.map((ml) => `${ml.userId}: ${ml.content}`),
          15,
          ''
        );
      }
    } else {
      // Paginated warn logs
      const allModLogs = getModLogForGuild({ guildId: server.guild.id });
      await descriptionPaginator(
        message.channel,
        'Mod Logs',
        allModLogs.map((ml) => `${ml.userId}: ${ml.count}`),
        15,
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
    const [userId, whichLog] = content.toLowerCase().split(' ');
    if (!userId || !REGEX_RAW_ID.test(userId)) {
      throw new CommandArgumentError(
        `Please specify a user by either mentioning them or using their ID`
      );
    }
    const clearAll = whichLog === 'all';
    const logNumber = parseInt(whichLog, 10);
    if (!clearAll && isNaN(logNumber)) {
      throw new CommandArgumentError(
        `Please specify which logs to clear, either by using the log number in \`${server.config.prefix}modlog\` or \`all\` to clear all.`
      );
    }
    const userModLogs = getModLogForUser({
      guildId: server.guild.id,
      userId: userId,
    });
    if (userModLogs.length === 0) {
      await message.channel.send(
        infoEmbed(`User <@${userId}> does not have any mod log entries.`)
      );
      return;
    }
    const clearedWarnings: ModLogEntry[] = [];
    if (clearAll) {
      // All warn logs
      const res = clearModLogForUser({
        guildId: server.guild.id,
        userId,
      });
      await message.channel.send(
        successEmbed(
          `Cleared ${pluralize('warning', 's', userModLogs.length)}.`
        )
      );
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
