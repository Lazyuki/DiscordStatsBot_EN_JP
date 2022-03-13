import logger from '@/logger';

// Run something at a specified time over setTimeout's limit of around 25 days
const runAt = (date: Date, func: () => void | Promise<void>) => {
  const now = new Date().getTime();
  const then = date.getTime();
  const diff = Math.max(then - now, 0);
  if (diff > 0x7f_fff_fff)
    setTimeout(() => {
      runAt(date, func);
    }, 0x7fffffff);
  else
    setTimeout(async () => {
      try {
        await func();
      } catch (e) {
        const error = e as Error;
        logger.error(`runAt function error: ${error?.message}`);
      }
    }, diff);
};

export default runAt;
