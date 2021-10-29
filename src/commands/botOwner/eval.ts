import { MessageEmbed } from 'discord.js';

import { BotCommand } from '../../types';

const command: BotCommand = {
  aliases: [],
  isAllowed: 'BOT_OWNER',
  description:
    'Can access message, content, bot. Send to the channel with `send()`',
  normalCommand: async (content, message, bot) => {
    try {
      const send = async (str: string) => await message.channel.send(str);
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
      const evalContent = `try { ${content} } catch (e) { await send(e.message.substr(0, 4000)) }`;
      const embed = new MessageEmbed();
      const func = new AsyncFunction(
        'content',
        'message',
        'bot',
        'send',
        'embed',
        evalContent
      );
      func(content, message, bot, send, embed);
    } catch (e) {
      await message.channel.send((e as Error).message);
    }
  },
};

export default command;
