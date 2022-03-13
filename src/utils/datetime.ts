import { formatDuration, intervalToDuration } from 'date-fns';

export function millisToDuration(millis?: number | null) {
  return formatDuration(intervalToDuration({ start: 0, end: millis || 0 }));
}
