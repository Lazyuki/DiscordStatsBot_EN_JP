import { ParsedBotCommand } from '@/types';
import { stripIndent } from 'common-tags';

const poll: ParsedBotCommand = {
  name: 'poll',
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description: 'Create a poll with reactions. 🆎 means "abstain"',
  examples: [
    [
      'poll',
      'will add reactions to the message right above the command that invoked this.',
    ],
    ['poll 1233345555567', 'to specify a message with an ID'],
    ['poll Should I sleep?', 'will start a new poll with the message'],
  ],
  isCirillaCommand: true,
};

const age: ParsedBotCommand = {
  name: 'age',
  aliases: ['joined'],
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description: 'Show when you joined this server',
  isCirillaCommand: true,
};

const boosters: ParsedBotCommand = {
  name: 'boosters',
  aliases: ['booster', 'boost', 'boosts'],
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description: 'Show Nitro Boosters',
  isCirillaCommand: true,
};

const bookmark: ParsedBotCommand = {
  name: 'bookmark',
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description:
    'React with the bookmark emoji 🔖 to send a copy of the reacted message into your DM. You must enable `Allow direct messages from server members` for this server in `Privacy Settings`.',
  isCirillaCommand: true,
};

const timestamp: ParsedBotCommand = {
  name: 'timestamp',
  aliases: ['ts', 'time', 'date'],
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description: stripIndent`
    Converts human readable date-time text or Discord ID into a timezone-aware Discord timestamp.
    Formats:
    "-F" Saturday, July 31, 2021 3:45 PM (default)
    "-d" 07/31/2021
    "-f" July 31, 2021 3:45 PM
    "-t" 3:45 PM
    "-D" July 31, 2021
    "-R" 10 minutes ago
    "-T" 3:45:12 PM`,
  options: [
    {
      name: 'copy',
      short: 'c',
      description:
        'Display the Discord timetstamp in a code block so you can copy it',
      bool: true,
    },
  ],
  arguments: '< human readable date-time > [ format flag ]',
  examples: ['timestamp in 3 hours -T', 'timestamp thursday 1:40AM -R -c'],
  isCirillaCommand: true,
};

const move: ParsedBotCommand = {
  name: 'move',
  aliases: ['mv'],
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description: stripIndent`
  Seamlessly move conversation to a different channel.
  The command invoker is included by default.`,
  options: [
    {
      name: 'limit',
      short: 'l',
      description:
        'Pass in this flag followed by a number to limit how far up in history it should search. Default/max is 20',
      bool: false,
    },
    {
      name: 'delete',
      short: 'd',
      description:
        ' Mods can pass in this flag to delete the original messages from the source channel',
      bool: true,
    },
    {
      name: 'force',
      short: 'f',
      description:
        'Mods can pass in this flag to temporarily mute them in the source channel',
      bool: true,
    },
  ],
  arguments: '<#destination-channel> <@mensions or IDs of users to move>',
  examples: [
    'mv #bot @Geralt 284840842026549259 -l 10',
    'mv #just_hanging_out_2 @Geralt -d -f',
  ],
  isCirillaCommand: true,
};

const voicePing: ParsedBotCommand = {
  name: 'voicePing',
  aliases: ['vp'],
  category: 'Utilities',
  isAllowed: () => true,
  normalCommand: () => {},
  description: 'Ping everyone in your VC room',
  isCirillaCommand: true,
};

export default [poll, age, boosters, bookmark, timestamp, move, voicePing];
