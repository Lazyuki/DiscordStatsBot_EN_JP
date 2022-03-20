import { BotCommand } from '@/types';
import { REGEX_USER } from '@/utils/regex';
import { dbInsertModLogEntry } from '@database/statements';

export function addModLog(entry: ModLogEntry) {
  dbInsertModLogEntry.run(entry);
}

const warn: BotCommand = {
  name: 'warn',
  isAllowed: 'SERVER_MODERATOR',
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
  normalCommand: async ({ content, message, options }) => {
    let targets = message.mentions.members;
    let reason = content.replace(REGEX_USER, '').trim();
    if (reason == '') {
      reason = 'unspecified';
    }
  },
};

const warnlog: BotCommand = {
  name: 'warnlog',
  isAllowed: 'SERVER_MODERATOR',
  description: 'List warning logs',
  arguments: '[@user]',
  aliases: ['wl'],
  examples: ['wl', 'wl 284840842026549259'],
  parentCommand: 'warn',
  normalCommand: async ({ content, message }) => {
    let targets = message.mentions.members;
    let reason = content.replace(REGEX_USER, '').trim();
    if (reason == '') {
      reason = 'unspecified';
    }
  },
};

const warnclear: BotCommand = {
  name: 'warnclear',
  isAllowed: 'SERVER_MODERATOR',
  description:
    'Clear a warning or all warnings for a user. Unless it was a silent warning, the user will be notified.',
  arguments: '<@user> <all | warning number in warnlog>',
  aliases: ['wc', 'unwarn'],
  examples: ['wc @Geralt all', 'unwarn 284840842026549259 3'],
  parentCommand: 'warn',
  normalCommand: async ({ content, message }) => {
    let targets = message.mentions.members;
    let reason = content.replace(REGEX_USER, '').trim();
    if (reason == '') {
      reason = 'unspecified';
    }
  },
};

export default [warn, warnlog, warnclear];
