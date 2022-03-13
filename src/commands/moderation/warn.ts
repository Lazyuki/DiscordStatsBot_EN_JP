import { BotCommand } from '@/types';
import { REGEX_USER } from '@/utils/regex';

const warn: BotCommand = {
  name: 'warn',
  isAllowed: 'SERVER_MODERATOR',
  description:
    'Warn people and add it to the warnlog entries. Use `log` instead to silently log the warning without messaging, or use `message` to send a DM without making it a warning',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'warn @Geralt being too good at Japanese',
    'warn 284840842026549259 299335689558949888 shut up',
    'warn -f 284840842026549259 Friendly reminder that you cannot speak arabic on this server',
  ],
  options: [
    '-s silent. Do NOT DM the warning to the user, but keep the log in the `warnlog`.',
    '-f friendly. Do NOT mark this as a warning, but just a "message" when sending the DM. Still kept in the `warnlog` ',
  ],
  childCommands: ['warnlog', 'warnclear'],
  normalCommand: async ({ commandContent, message }) => {
    let targets = message.mentions.members;
    let reason = commandContent.replace(REGEX_USER, '').trim();
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
  examples: ['wl', 'warnlog 284840842026549259'],
  parentCommand: 'warn',
  normalCommand: async ({ commandContent, message }) => {
    let targets = message.mentions.members;
    let reason = commandContent.replace(REGEX_USER, '').trim();
    if (reason == '') {
      reason = 'unspecified';
    }
  },
};

const warnclear: BotCommand = {
  name: 'warnclear',
  isAllowed: 'SERVER_MODERATOR',
  description: 'Clear a warning or all warnings for a user',
  arguments: '<@user> <all | warning number in warnlog>',
  aliases: ['wc', 'unwarn'],
  examples: ['wc @Geralt all', 'unwarn 284840842026549259 3'],
  parentCommand: 'warn',
  normalCommand: async ({ commandContent, message }) => {
    let targets = message.mentions.members;
    let reason = commandContent.replace(REGEX_USER, '').trim();
    if (reason == '') {
      reason = 'unspecified';
    }
  },
};

export default [warn, warnlog, warnclear];
