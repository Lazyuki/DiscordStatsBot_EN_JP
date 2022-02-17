import { MessageEmbed } from 'discord.js';
import { makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';

const command: BotCommand = {
  isAllowed: 'BOT_OWNER',
  description:
    'Can access [message, content, bot, server, send, makeEmbed]. Send to the channel with `send()` or simply return',
  examples: [
    '{PF}eval return message.guild.memberCount',
    '{PF}eval send(makeEmbed({ description: "Hello" }))',
  ],
  normalCommand: async ({
    commandContent,
    message,
    bot,
    server,
    reply,
    send,
  }) => {
    try {
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
      const evalContent = `try { ${commandContent} } catch (e) { await send(e.message && e.message.substr(0, 2000)); }`;
      const embed = new MessageEmbed();
      const func = new AsyncFunction(
        'content',
        'message',
        'bot',
        'server',
        'send',
        'makeEmbed',
        evalContent
      );
      const ret = await func(
        commandContent,
        message,
        bot,
        server,
        send,
        makeEmbed
      );
      if (ret !== undefined) {
        await send(successEmbed(String(ret) || '*empty string*'));
      } else {
        await message.react('✅');
      }
    } catch (e) {
      await reply((e as Error).message);
    }
  },
};

export default command;
