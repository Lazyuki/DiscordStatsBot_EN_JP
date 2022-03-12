import { BotEvent } from '@/types';
import checkLang from '@utils/checkLang';
import { getParentChannelId } from '@utils/discordGetters';
import checkSafeMessage from '@utils/checkSafeMessage';
import { makeEmbed } from '@utils/embed';

const createEvent: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  once: false,
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      return;
    }
    const server = bot.servers[message.guild.id];
    if (!server.config.hardcoreRole || !server.config.japaneseRole) return; // Hardcore not configured on this server

    const channelId = getParentChannelId(message.channel);
    if (!message.member.roles.cache.has(server.config.hardcoreRole)) return;
    if (server.config.hardcoreIgnoredChannels.includes(channelId)) return;
    if (server.config.hiddenChannels.includes(channelId)) return; // Not in mod channels

    const isJapanese = message.member.roles.cache.has(
      server.config.japaneseRole
    );

    const { lang, escaped } = checkLang(message.content);
    if (escaped) return;
    if (isJapanese && lang === 'JP') {
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
      setTimeout(() => {
        message.delete();
      }, 200); // Wait a little before deleting or Discord sometimes shows the deleted message
      return;
    }
    if (!isJapanese && lang === 'EN') {
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
        setTimeout(() => {
          message.delete();
        }, 200); // Wait a little before deleting or Discord sometimes shows the deleted message
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
