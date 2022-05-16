import { Bot } from '@/types';
import { formatCategoryClock, getStartHourISO } from '@utils/datetime';
import { cleanOldAttachmentFiles } from '@utils/images';

function hourlyTask(bot: Bot) {
  bot.utcHour = getStartHourISO();
  for (const server of Object.values(bot.servers)) {
    server.guild.members.fetch(); // fetch all members even if offline
    if (server.data.categoryClocks?.length) {
      for (const categoryClock of server.data.categoryClocks) {
        const category = server.guild.channels.cache.get(
          categoryClock.categoryId
        );
        if (category) {
          category.setName(
            formatCategoryClock(categoryClock.timeString, categoryClock.zeroPad)
          );
        }
      }
    }
    server.save();
  }
  cleanOldAttachmentFiles();
}

export default hourlyTask;
