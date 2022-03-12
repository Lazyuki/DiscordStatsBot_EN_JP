import { BotCommand } from '@/types';
import db from '@database';

const command: BotCommand = {
  name: 'restart',
  isAllowed: 'BOT_OWNER',
  description: 'Restart the bot',
  normalCommand: async ({ bot, message }) => {
    await message.channel.send('Restarting...');
    // Write to file which guild/channel/thread the restart command was called in
    for (const serverId in bot.servers) {
      const server = bot.servers[serverId];
      server.save();
    }
    bot.destroy();
    db.close();
    process.exit(2);
  },
};

export default command;
