import { BotEvent } from '@/types';
import { getTextChannel, isMessageInChannels } from '@utils/guildUtils';
import checkSafeMessage from '@utils/checkSafeMessage';
import { makeEmbed } from '@utils/embed';

export function checkKeywordMatch(content: string, regexes: RegExp[]) {
  const matches = regexes
    .map((regex) => {
      const match = content.match(regex);
      if (match) {
        const matchedRaw = match[0];
        const matched =
          matchedRaw.length > 30
            ? `${matchedRaw.slice(0, 30)} ...`
            : matchedRaw;
        return {
          matched,
          matchedRaw,
          regex: regex.toString().slice(1, -2),
        };
      } else {
        return null;
      }
    })
    .filter(Boolean) as {
    matched: string;
    matchedRaw: string;
    regex: string;
  }[];
  return matches;
}

const createEvent: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];

    // No mod log channel
    if (!server.config.modLogChannel) return;
    const modLog = getTextChannel(server.guild, server.config.modLogChannel);
    if (!modLog) return;
    // No regexes
    if (server.temp.keywordRegexes.length === 0) return;
    // ignore hidden channels
    if (isMessageInChannels(message, server.config.hiddenChannels)) return;

    const matches = checkKeywordMatch(
      message.content,
      server.temp.keywordRegexes
    );
    if (matches.length > 0) {
      await modLog.send(
        makeEmbed({
          color: 'DarkOrange',
          authorName: `${message.author.tag} (${message.author.id})`,
          authorIcon: message.author.displayAvatarURL(),
          title: `Keyword Match [Jump]`,
          titleUrl: message.url,
          description: message.content,
          fields: matches.map((match) => ({
            name: `Regex: \`${match.regex}\``,
            value: `**Match**: \`${match.matched}\``,
            inline: true,
          })),
          footer: `#${message.channel.name} (${message.channel.id})`,
          timestamp: true,
        })
      );
    }
  },
};

const updateEvent: BotEvent<'messageUpdate'> = {
  eventName: 'messageUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMessage, newMessage) => {
    if (newMessage.partial || oldMessage.partial) return;
    if (!checkSafeMessage(bot, newMessage)) {
      return;
    }
    const server = bot.servers[newMessage.guild.id];
    const newMatches = checkKeywordMatch(
      newMessage.content,
      server.temp.keywordRegexes
    );
    if (newMatches.length > 0) {
      const oldMatches = checkKeywordMatch(
        oldMessage.content,
        server.temp.keywordRegexes
      );
      if (oldMatches.length === 0) {
        // Edited in the keyword
        await createEvent.processEvent(bot, newMessage);
      }
    }
  },
};

export default [createEvent, updateEvent];
