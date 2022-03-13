import { Bot } from '@/types';
import dailyTask from './dailyTask';
import hourlyTask from './hourlyTask';
import { startOfHour } from 'date-fns';

const HOUR_MILLIS = 60 * 60_000;

function initialTask(bot: Bot) {
  const now = new Date();
  const startOfThisHour = startOfHour(now);
  const millisUntilNextHour =
    HOUR_MILLIS - (now.getTime() - startOfThisHour.getTime());
  startOfThisHour.setUTCDate(startOfThisHour.getUTCDate() + 1);
  startOfThisHour.setUTCHours(0);
  const millisUntilTomorrow = startOfThisHour.getTime() - now.getTime();

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
