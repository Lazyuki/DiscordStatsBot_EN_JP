import { BotCommand } from '@/types';

const command: BotCommand = {
  name: 'ping',
  description: 'Bot ping in milliseconds',
  normalCommand: async ({ message, bot }) => {
    const now = new Date().getTime();
    const sent = await message.channel.send('calculating...');
    const now2 = new Date().getTime();
    await sent.edit(`${now2 - now} ms`);
  },
};

export default command;
