import { startOfHour } from 'date-fns';

import { clearOldRecords } from '@database/statements';
import { Bot } from '@/types';

import dailyTask from './dailyTask';
import hourlyTask from './hourlyTask';
import { getTodayISO, getStartHourISO } from '@utils/datetime';

const HOUR_MILLIS = 60 * 60_000;

declare module '@/types' {
  interface ServerTemp {
    sortedActiveMemberIds: string[]; // Members who have been active in the past 30 days, sorted by their message/voice count
  }
}

function initialTask(bot: Bot) {
  const now = new Date();
  const startOfThisHour = startOfHour(now);
  const millisUntilNextHour =
    HOUR_MILLIS - (now.getTime() - startOfThisHour.getTime());
  startOfThisHour.setUTCDate(startOfThisHour.getUTCDate() + 1);
  startOfThisHour.setUTCHours(0);
  const millisUntilTomorrow = startOfThisHour.getTime() - now.getTime();

  clearOldRecords();
  bot.utcHour = getStartHourISO();
  bot.utcDay = getTodayISO();

  setTimeout(() => {
    hourlyTask(bot);
    setInterval(() => {
      hourlyTask(bot);
    }, HOUR_MILLIS);
  }, millisUntilNextHour);

  setTimeout(() => {
    dailyTask(bot);
    setInterval(() => {
      dailyTask(bot);
    }, HOUR_MILLIS * 24);
  }, millisUntilTomorrow);
}

export default initialTask;
