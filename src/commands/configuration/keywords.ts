import { BotCommand } from '@/types';
import {
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { escapeCodeBlock, inlineCode } from 'discord.js';
import { checkKeywordMatch } from '@events/onKeywordMessage';
import { pluralize } from '@utils/pluralize';
import { joinNaturally } from '@utils/formatString';

declare module '@/types' {
  interface ServerData {
    keywords: string[];
  }
}

declare module '@/types' {
  interface ServerTemp {
    keywordRegexes: RegExp[];
  }
}

const SUB_COMMANDS = ['add', 'remove', 'del', 'rem', 'delete', 'list', 'test'];

function buildRegexes(keys: string[]) {
  return keys.map((key) => new RegExp(key, 'i'));
}

const command: BotCommand = {
  name: 'keywords',
  aliases: ['keys', 'key'],
  isAllowed: ['ADMIN'],
  arguments: '< add | remove | list | test > [regex keys ... ]',
  description:
    'Log messages that match certain keyword regexes. Keys can be wrapped in a code block to escape Discord formatting.',
  examples: [
    'key add \\bchink\\b',
    'key remove \\`:callMods:\\`',
    'key test would this trigger?',
  ],
  onCommandInit: (server) => {
    server.data.keywords ||= [];
    server.temp.keywordRegexes ||= buildRegexes(server.data.keywords);
  },
  normalCommand: async ({ content, server, message }) => {
    const sendList = async () => {
      await message.channel.send(
        makeEmbed({
          title: 'Current Keywords',
          description:
            server.data.keywords.map(inlineCode).join('\n') || 'None',
          footer: `Type "${server.config.prefix}key add" or "${server.config.prefix}key remove" to update the list.`,
        })
      );
    };
    if (!content) {
      // Show current config
      await sendList();
      return;
    } else {
      const subCommand = content.toLowerCase().split(' ')[0];
      if (SUB_COMMANDS.includes(subCommand)) {
        let key = content.replace(new RegExp(`^${subCommand}`), '').trim();
        if (key.startsWith('`') && key.endsWith('`')) {
          // if inline code block, excape
          key = key.slice(1, -1);
        }
        const exists = server.data.keywords.includes(key);
        switch (subCommand) {
          case 'list': {
            await sendList();
            return;
          }
          case 'test': {
            const matches = checkKeywordMatch(key, server.temp.keywordRegexes);
            if (matches.length > 0) {
              await message.reply(
                successEmbed(
                  `This message matched the following ${pluralize(
                    'key',
                    's',
                    matches.length
                  )}: ${joinNaturally(matches.map((m) => inlineCode(m.regex)))}`
                )
              );
            } else {
              await message.reply(
                warningEmbed(`This message did not match any keyword`)
              );
            }
            return;
          }
          case 'add': {
            if (key === '') {
              await message.channel.send(
                errorEmbed(`Please specify a key to add`)
              );
              return;
            }
            if (exists) {
              await message.channel.send(
                errorEmbed(`The key \`${key}\` already exists`)
              );
              return;
            }
            server.data.keywords.push(key);
            server.temp.keywordRegexes = buildRegexes(server.data.keywords);
            server.save();
            await message.channel.send(successEmbed(`Key \`${key}\` added.`));
            return;
          }
          case 'remove':
          case 'rem':
          case 'delete':
          case 'del': {
            if (key === '') {
              await message.channel.send(
                errorEmbed(`Please specify a key to remove`)
              );
              return;
            }
            if (!exists) {
              await message.channel.send(
                errorEmbed(
                  `The key \`${key}\` does not exist. Make sure every letter matches the key.`
                )
              );
              return;
            }
            const index = server.data.keywords.indexOf(key);
            server.data.keywords.splice(index, 1);
            server.temp.keywordRegexes = buildRegexes(server.data.keywords);
            server.save();
            await message.channel.send(successEmbed(`Key \`${key}\` removed.`));
            return;
          }
        }
      } else {
        await message.channel.send(
          errorEmbed(
            `Invalid sub-command. Please specify \`add\`, \`remove\`, or \`list\``
          )
        );
      }
    }
  },
};

export default command;
