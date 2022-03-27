import { getUserId, parseMembers } from '@utils/argumentParsers';
import { Bot, BotCommand, GuildMessage } from '@/types';
import {
  getEmojiLeaderboard,
  getEnglishLeaderboard,
  getSingleEmojiLeaderboard,
} from '@database/statements';
import { fieldsPaginator } from '@utils/paginate';
import { Message } from 'discord.js';
import Server from '@classes/Server';
import { infoEmbed, warningEmbed } from '@utils/embed';
import { resolveEmoji } from '@utils/formatString';
import { pluralCount } from '@utils/pluralize';

const command: BotCommand = {
  name: 'emojiLeaderboard',
  description:
    'Emoji leaderboard for the server. Both messages and reactions are counted. If you provide an emoji, then the leaderboard for that particular emoji will be shown.',
  aliases: ['eml', 'emlb'],
  options: [
    {
      name: 'all',
      short: 'a',
      description:
        'Include Discord emojis outside of this server and unicode emojis as well',
      bool: true,
    },
    {
      name: 'unicode',
      short: 'u',
      description: 'Only show unicode emojis',
      bool: true,
    },
    {
      name: 'least',
      short: 'l',
      description: 'Show least used emojis in the server first',
      bool: true,
    },
  ],
  arguments: '[emoji]',
  requiredServerConfigs: ['statistics'],
  examples: ['eml', 'eml -l', 'eml :pikaLOL:'],
  normalCommand: async ({ message, bot, server, content, options }) => {
    // Show user leaderboad for a single emoji
    if (content) {
      await singleEmojiLeaderboard(message, bot, server, content);
      return;
    }

    const showAll = Boolean(options['all']);
    const unicodeOnly = Boolean(options['unicode']);
    const leastFirst = Boolean(options['least']);

    const emojis = getEmojiLeaderboard({
      guildId: server.guild.id,
    });

    const filteredEmojis = showAll
      ? emojis
      : unicodeOnly
      ? emojis.filter((e) => !e.emoji.startsWith('<'))
      : emojis.filter((e) => server.guild.emojis.resolve(e.emoji));

    if (leastFirst) {
      if (!showAll && !unicodeOnly) {
        // Add server emojis with 0 use
        const emojiKeys = filteredEmojis.map((e) => e.emoji);
        const serverEmojis = server.guild.emojis.cache
          .mapValues((e) => e.toString())
          .values();
        for (const serverEmoji of serverEmojis) {
          if (!emojiKeys.includes(serverEmoji)) {
            filteredEmojis.push({ emoji: serverEmoji, count: 0, rank: 0 });
          }
        }
      }
      filteredEmojis.reverse();
      const usagesToEmoji: Record<string, string[]> = {};
      filteredEmojis.forEach(({ emoji, count }) => {
        const countStr = String(count);
        if (countStr in usagesToEmoji) {
          usagesToEmoji[countStr].push(emoji);
        } else {
          usagesToEmoji[count] = [emoji];
        }
      });
      const fields = Object.entries(usagesToEmoji).map(([countStr, emojis]) => {
        return {
          name: pluralCount('time', 's', parseInt(countStr)),
          value: emojis.map((e) => resolveEmoji(e, bot)).join(' '),
        };
      });
      await fieldsPaginator(
        message.channel,
        `${
          showAll ? 'Global' : unicodeOnly ? 'Unicode' : 'Server'
        } Emoji Least Used Leaderboard`,
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
        } Emoji Usage Leaderboard`,
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
  message: GuildMessage<Message>,
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
    `Emoji Leaderboard for "${resolveEmoji(content, bot)}"`,
    `Total messages and reactions in the last 30 days`,
    fields,
    true,
    -1,
    message.author.id
  );
}

export default command;
