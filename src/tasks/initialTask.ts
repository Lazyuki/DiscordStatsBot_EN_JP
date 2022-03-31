import { startOfHour } from 'date-fns';

import { clearOldRecords } from '@database/statements';
import { Bot, BotConfig } from '@/types';

import dailyTask from './dailyTask';
import hourlyTask from './hourlyTask';
import { getTodayISO, getStartHourISO } from '@utils/datetime';

const HOUR_MILLIS = 60 * 60_000;

declare module '@/types' {
  interface ServerTemp {
    sortedActiveMemberIds: string[]; // Members who have been active in the past 30 days, sorted by their message/voice count
  }
  interface BotConfig {
    beginnerKanjis: string[];
  }
}

const DEFAULT_CONFIG: BotConfig = {
  beginnerKanjis: [],
};

function initialTask(bot: Bot) {
  // TODO: Read from file
  bot.botConfig = { ...DEFAULT_CONFIG };

  const now = new Date();
  const startOfThisHour = startOfHour(now);
  const millisUntilNextHour =
    HOUR_MILLIS - (now.getTime() - startOfThisHour.getTime());
  startOfThisHour.setUTCDate(startOfThisHour.getUTCDate() + 1);
  startOfThisHour.setUTCHours(0);
  const millisUntilTomorrow = startOfThisHour.getTime() - now.getTime();

  clearOldRecords();

  setTimeout(() => {
    setInterval(() => {
      hourlyTask(bot);
    }, HOUR_MILLIS);
  }, millisUntilNextHour);

  setTimeout(() => {
    setInterval(() => {
      dailyTask(bot);
    }, HOUR_MILLIS * 24);
  }, millisUntilTomorrow);
}

export default initialTask;
