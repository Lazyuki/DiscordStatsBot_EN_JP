import { formatDuration, intervalToDuration } from 'date-fns';
import { GuildMember } from 'discord.js';
import pluralize from './pluralize';

const MINUTE_IN_MILLIS = 60 * 1000;
const HOUR_IN_MILLIS = 60 * MINUTE_IN_MILLIS;
const DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS;

export function millisToDuration(millis?: number | null) {
  return formatDuration(intervalToDuration({ start: 0, end: millis || 0 }));
}

export function memberJoinAge(member: GuildMember, maxDays: number = 3) {
  const now = new Date().getTime();
  const joinedAt = member.joinedAt;
  if (joinedAt) {
    const memeberAge = now - joinedAt.getTime();
    if (memeberAge < maxDays * DAY_IN_MILLIS) {
      let ageString = '';
      const days = Math.floor(memeberAge / DAY_IN_MILLIS);
      const hours = Math.floor(memeberAge / HOUR_IN_MILLIS);
      const minutes = Math.floor(memeberAge / MINUTE_IN_MILLIS);
      const seconds = Math.floor(memeberAge / 1000);
      if (days >= 3) ageString = pluralize('day', 's', days);
      else if (hours > 0) ageString = pluralize('hour', 's', hours);
      else if (minutes > 0) ageString = pluralize('minute', 's', minutes);
      else ageString = pluralize('second', 's', seconds);
      return `joined ${ageString} ago`;
    }
  }
  return '';
}
