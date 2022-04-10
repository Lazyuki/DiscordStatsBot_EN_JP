import { BotEvent } from '@/types';
import checkLang from '@utils/checkLang';
import { isMessageInChannels } from '@utils/guildUtils';
import checkSafeMessage from '@utils/checkSafeMessage';
import { makeEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';
import { NE } from '@utils/constants';

const createEvent: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    if (!server.config.hardcoreRole || !server.config.japaneseRoles?.length)
      return; // Hardcore not configured on this server

    if (!message.member.roles.cache.has(server.config.hardcoreRole)) return;
    if (isMessageInChannels(message, server.config.hardcoreIgnoredChannels))
      return;
    if (isMessageInChannels(message, server.config.hiddenChannels)) return; // Not in mod channels

    const isJapanese =
      message.member.roles.cache.hasAny(...server.config.japaneseRoles) &&
      !message.member.roles.cache.has(NE); // EJLX specific

    const { lang, escaped } = checkLang(message.content);
    if (escaped) return;
    if (isJapanese && lang === 'JP') {
      safeDelete(message);
      if (message.content.length > 80) {
        try {
          await message.author.send(
            makeEmbed({
              content:
                'ハードコアモードにより、長いメッセージを消してしまったようです。重要な可能性があるため再送いたします。',
              color: '#db3c3c',
              description: message.content,
              footer: `#${message.channel.name}`,
              timestamp: true,
            })
          );
        } catch (e) {} // pass, DM disabled
      }
      return;
    }
    if (!isJapanese && lang === 'EN') {
      safeDelete(message);
      // English
      if (message.content.length > 120) {
        try {
          await message.author.send(
            makeEmbed({
              content:
                'It seems like I deleted your long message that might be important.',
              color: '#db3c3c',
              description: message.content,
              footer: `#${message.channel.name}`,
              timestamp: true,
            })
          );
        } catch (e) {} // pass, DM disabled
        return;
      }
    }
  },
};

const updateEvent: BotEvent<'messageUpdate'> = {
  eventName: 'messageUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMessage, newMessage) => {
    if (newMessage.partial) return;
    await createEvent.processEvent(bot, newMessage);
  },
};

export default [createEvent, updateEvent];
