import { BotCommand } from '@/types';
import db from '@database';

const command: BotCommand = {
  name: 'kill',
  isAllowed: 'BOT_OWNER',
  description: 'Kill the bot',
  normalCommand: async ({ bot, message, send }) => {
    await message.channel.send('Good bye...');
    for (const serverId in bot.servers) {
      const server = bot.servers[serverId];
      server.save();
    }
    bot.destroy();
    db.close();
    process.exit(0);
  },
};

export default command;
