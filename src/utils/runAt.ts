import logger from '@/logger';
import Server from '@classes/Server';
import { DiscordAPIError, GuildMember } from 'discord.js';

// Run something at a specified time over setTimeout's limit of around 25 days
export const runAt = (
  date: Date | number,
  func: () => void | Promise<void>
) => {
  const now = new Date().getTime();
  const then = typeof date === 'number' ? date : date.getTime();
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

// Get member from userId if they are still in the server, and then call the function
// Use with runAt since you don't know if the member is still in the server later
export async function getMemberOrRepeat(
  userId: string,
  server: Server,
  func: (member: GuildMember, server: Server) => Promise<void>,
  onError?: () => void
) {
  let member = server.guild.members.cache.get(userId);
  if (!member) {
    try {
      member = await server.guild.members.fetch(userId);
    } catch (e) {
      const err = e as DiscordAPIError;
      logger.error('getMemberOrRepeat Error: ', e);
      if (err.httpStatus && err.httpStatus >= 500) {
        // Discord outage? Try again in 30 minutes
        runAt(new Date().getTime() + 30 * 60_000, () =>
          getMemberOrRepeat(userId, server, func, onError)
        );
        return;
      }
      // User left? Clean up
      onError?.();
      return;
    }
  }
  await func(member, server);
}

export default runAt;
