import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';

const command: BotCommand = {
  name: 'eval',
  isAllowed: ['BOT_OWNER'],
  description:
    'Can access [message, content, bot, server, send, makeEmbed, str]. Send to the channel with `send()` or simply return',
  examples: [
    'eval return message.guild.memberCount',
    'eval send(makeEmbed({ description: "Hello" }))',
  ],
  normalCommand: async ({ content, message, bot, server, reply, send }) => {
    try {
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
      const evalContent = `try { ${content} } catch (e) { await send(e.message && e.message.substr(0, 2000)); }`;
      const func = new AsyncFunction(
        'content',
        'message',
        'bot',
        'server',
        'send',
        'makeEmbed',
        'str',
        evalContent
      );
      const str = (obj: object) =>
        typeof obj === 'object' ? JSON.stringify(obj, null, 4) : obj;
      const ret = await func(
        content,
        message,
        bot,
        server,
        send,
        makeEmbed,
        str
      );
      if (ret !== undefined) {
        await send(successEmbed(String(ret) || '*empty string*'));
      } else {
        await message.react('✅');
      }
    } catch (e) {
      const err = e as Error;
      await reply(errorEmbed(`${err.name}: ${err.message}`));
    }
  },
};

export default command;
