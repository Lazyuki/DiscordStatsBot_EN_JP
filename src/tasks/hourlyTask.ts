import { Bot } from '@/types';
import { getStartHourISO } from '@utils/datetime';

function hourlyTask(bot: Bot) {
  bot.utcHour = getStartHourISO();
  for (const server of Object.values(bot.servers)) {
    server.save();
  }
}

export default hourlyTask;
