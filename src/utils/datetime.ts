import { TimestampFlag } from '@/types';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { GuildMember } from 'discord.js';
import { pluralize } from './pluralize';

export const MINUTE_IN_MILLIS = 60 * 1000;
export const HOUR_IN_MILLIS = 60 * MINUTE_IN_MILLIS;
export const DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS;

const TIME_REGEX =
  /([0-9]+\s?d\s*)?([0-9]+\s?h\s*)?([0-9]+\s?m\s*)?([0-9]+\s?s)?/i;

export function millisToDuration(millis?: number | null) {
  return formatDuration(intervalToDuration({ start: 0, end: millis || 0 }));
}

export function secondsToVcTime(seconds: number) {
  if (seconds === 0) {
    return 'Never';
  }
  const millis = seconds * 1000;
  const hours = Math.floor(millis / HOUR_IN_MILLIS);
  const minutes = Math.floor((millis % HOUR_IN_MILLIS) / MINUTE_IN_MILLIS);
  return `${hours ? `${hours}hr ` : ''}${minutes}min`;
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

export function getExactDaysAgo(days: number) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  return daysAgo;
}

export function getDaysAgo(days: number) {
  const daysAgo = getStartDateTime(true);
  daysAgo.setDate(daysAgo.getUTCDate() - days);
  return daysAgo;
}

export function dateStringForActivity(d: Date) {
  return format(d, 'MMM dd (EEE)');
}

export function pastDays(days: number) {
  return Array(days + 1)
    .fill(0)
    .map((_, index) => getDaysAgo(days - index));
}

function getStartDateTime(ignoreHour: boolean) {
  const now = new Date();
  if (ignoreHour) {
    now.setUTCHours(0);
  }
  now.setUTCMinutes(0);
  now.setUTCSeconds(0);
  now.setUTCMilliseconds(0);
  return now;
}

/**
 *
 * Return
 * @returns an ISO string of now, with just the date, and optionally the hour as well. e.g. 2022-01-15T00:00:00.000Z
 */
export function getTodayISO(): string {
  return getStartDateTime(true).toISOString();
}

/**
 *
 * Return
 * @returns an ISO string of start of this hour, with just the date and the hour. e.g. 2022-01-15T11:00:00.000Z
 */
export function getStartHourISO(): string {
  return getStartDateTime(false).toISOString();
}

export function getDiscordTimestamp(date: Date, option: TimestampFlag) {
  return `<t:${Math.floor(date.getTime() / 1000)}:${option || 'F'}>`;
}

export function strToMillis(content: string): {
  millis: number;
  restContent: string;
} {
  const match = content.match(TIME_REGEX);
  if (!match || !match[0]) {
    return { millis: 0, restContent: content };
  }
  const [_, days, hours, minutes, seconds] = match.map((s) =>
    parseInt(s || '0')
  );
  const totalMillis =
    days * DAY_IN_MILLIS +
    hours * HOUR_IN_MILLIS +
    minutes * MINUTE_IN_MILLIS +
    seconds * 1000;

  return { millis: totalMillis, restContent: content.replace(TIME_REGEX, '') };
}
