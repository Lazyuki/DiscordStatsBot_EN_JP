import { Bot } from '@/types';

function hourlyTask(bot: Bot) {
  for (const server of Object.values(bot.servers)) {
    server.save();
  }
}

export default hourlyTask;
