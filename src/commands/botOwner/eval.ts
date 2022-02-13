import { MessageEmbed } from 'discord.js';
import { makeEmbed } from 'utils/embed';
import { BotCommand } from 'types';

const command: BotCommand = {
  isAllowed: 'BOT_OWNER',
  description:
    'Can access [message, content, bot, server, send, makeEmbed]. Send to the channel with `send()`',
  examples: [
    '{PF}eval send(message.guild.memberCount)',
    '{PF}eval send(makeEmbed({ description: "Hello" }))',
  ],
  normalCommand: async ({ commandContent, message, bot, server }) => {
    try {
      const send = async (str: string) =>
        await message.channel.send(str || '*empty*');
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
      const evalContent = `try { ${commandContent} } catch (e) { await send(e.message.substr(0, 4000)) }`;
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
      func(commandContent, message, bot, server, send, makeEmbed);
    } catch (e) {
      await message.channel.send((e as Error).message);
    }
  },
};

export default command;
