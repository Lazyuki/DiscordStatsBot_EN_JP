import { Bot, BotCommand, GuildMessage } from '@/types';
import {
  getEmojiLeaderboard,
  getSingleEmojiLeaderboard,
} from '@database/statements';
import { fieldsPaginator } from '@utils/paginate';
import Server from '@classes/Server';
import { infoEmbed, EmbedField } from '@utils/embed';
import { getServerEmoji, resolveEmoji } from '@utils/formatString';
import { pluralCount } from '@utils/pluralize';
import { CommandArgumentError } from '@/errors';

const KANA_EMOJI = /[0-9]{2}_kana_/;

const command: BotCommand = {
  name: 'emojiLeaderboard',
  description:
    'Emoji leaderboard for the server. Both messages and reactions are counted. If you provide an emoji, then the leaderboard for that particular emoji will be shown.',
  aliases: ['eml', 'emlb'],
  options: [
    {
      name: 'global',
      short: 'g',
      description:
        'Include Discord emojis outside of this server and unicode emojis as well. By default, the leaderboard only shows server emojis',
      bool: true,
    },
    {
      name: 'animated',
      short: 'a',
      description: 'Only show animated emojis',
      bool: true,
    },
    {
      name: 'static',
      short: 's',
      description: 'Only show static emojis',
      bool: true,
    },
    {
      name: 'least',
      short: 'l',
      description: 'Show least used emojis in the server first',
      bool: true,
    },
    {
      name: 'unicode',
      short: 'u',
      description:
        'Only show unicode emojis. Cannot be used with other options.',
      bool: true,
    },
  ],
  arguments: '[emoji]',
  requiredServerConfigs: ['statistics'],
  examples: ['eml', 'eml -l', 'eml -ls', 'eml :pikaLOL:'],
  normalCommand: async ({ message, bot, server, content, options }) => {
    // Show user leaderboad for a single emoji
    if (content) {
      await singleEmojiLeaderboard(message, bot, server, content);
      return;
    }

    const showAll = Boolean(options['global']);
    const animatedOnly = Boolean(options['animated']);
    const staticOnly = Boolean(options['static']);
    const unicodeOnly = Boolean(options['unicode']);
    const leastFirst = Boolean(options['least']);
    if (animatedOnly && staticOnly) {
      throw new CommandArgumentError("There's no animated static emoji...");
    }
    if (unicodeOnly && (animatedOnly || staticOnly || showAll || leastFirst)) {
      throw new CommandArgumentError(
        'The unicode option can only be used by itself'
      );
    }

    const filter = (emoji: string) => {
      if (unicodeOnly) return !emoji.startsWith('<');
      if (animatedOnly && !emoji.startsWith('<a')) return false;
      if (staticOnly && emoji.startsWith('<a')) return false;
      if (!showAll && !getServerEmoji(emoji, server.guild)) return false;
      return true;
    };

    const emojis = getEmojiLeaderboard({
      guildId: server.guild.id,
    });

    const filteredEmojis = emojis.filter((e) => filter(e.emoji));

    if (leastFirst) {
      if (!showAll && !unicodeOnly) {
        // Add server emojis with 0 use
        const emojiKeys = filteredEmojis.map((e) => e.emoji);
        const serverEmojis = server.guild.emojis.cache
          .mapValues((e) => e.toString())
          .filter((e) => filter(e))
          .values();
        for (const serverEmoji of serverEmojis) {
          if (!emojiKeys.includes(serverEmoji)) {
            filteredEmojis.push({ emoji: serverEmoji, count: 0 });
          }
        }
      }
      filteredEmojis.reverse();
      const usagesToEmoji: Record<string, string[]> = {};
      filteredEmojis.forEach(({ emoji, count }) => {
        if (KANA_EMOJI.test(emoji)) return; // Ignore EJLX Kana emojis
        const countStr = String(count);
        if (countStr in usagesToEmoji) {
          usagesToEmoji[countStr].push(resolveEmoji(emoji, bot));
        } else {
          usagesToEmoji[countStr] = [resolveEmoji(emoji, bot)];
        }
      });
      const fields: EmbedField[] = [];

      Object.entries(usagesToEmoji).forEach(([countStr, emojis]) => {
        const joinedEmojis = emojis.join('');
        if (joinedEmojis.length > 1024) {
          // embed value max len
          const safeEmojiStrings: string[] = [];
          let buffer = '';
          emojis.forEach((e) => {
            if (buffer.length + e.length > 1024) {
              safeEmojiStrings.push(buffer);
              buffer = e;
            } else {
              buffer += e;
            }
          });
          safeEmojiStrings.push(buffer);
          safeEmojiStrings.forEach((e) => {
            fields.push({
              name: pluralCount('time', 's', parseInt(countStr)),
              value: e,
            });
          });
        } else {
          fields.push({
            name: pluralCount('time', 's', parseInt(countStr)),
            value: joinedEmojis,
          });
        }
      });
      await fieldsPaginator(
        message.channel,
        `${
          showAll ? 'Global' : unicodeOnly ? 'Unicode' : 'Server'
        } Emoji Least Used Leaderboard${staticOnly ? '(Static Only)' : ''}${
          animatedOnly ? '(Animated Only)' : ''
        }`,
        `Total messages and reactions in the last 30 days`,
        fields,
        true,
        -1,
        message.author.id
      );
    } else {
      const fields = filteredEmojis.map(({ emoji, count }, index) => {
        return {
          name: `${index + 1}) ${resolveEmoji(emoji, bot)}`,
          value: pluralCount('time', 's', count),
        };
      });
      await fieldsPaginator(
        message.channel,
        `${
          showAll ? 'Global' : unicodeOnly ? 'Unicode' : 'Server'
        } Emoji Usage Leaderboard${staticOnly ? '(Static Only)' : ''}${
          animatedOnly ? '(Animated Only)' : ''
        }`,
        `Total messages and reactions in the last 30 days`,
        fields,
        true,
        -1,
        message.author.id
      );
    }
  },
};

async function singleEmojiLeaderboard(
  message: GuildMessage,
  bot: Bot,
  server: Server,
  content: string
) {
  const users = getSingleEmojiLeaderboard({
    guildId: server.guild.id,
    emojiName: content,
  });
  if (users.length === 0) {
    await message.channel.send(
      infoEmbed(`The emoji \`${content}\` has never been used on this server`)
    );
    return;
  }
  // Unicode emoji or emoji available to the bot.
  const fields = users.map(({ userId, count }, index) => {
    const user = bot.users.cache.get(userId)?.username || `*${userId}*`;
    return {
      name: `${index + 1}) ${user}`,
      value: `${count}`,
    };
  });

  await fieldsPaginator(
    message.channel,
    `Emoji Leaderboard for ${resolveEmoji(content, bot)}`,
    `Total messages and reactions in the last 30 days`,
    fields,
    true,
    -1,
    message.author.id
  );
}

export default command;
