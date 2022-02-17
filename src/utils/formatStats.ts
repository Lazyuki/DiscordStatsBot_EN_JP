/**
 *
 * Return
 * @param useHours Whether to include the hour. @default = true
 * @returns an ISO string of now, with just the date, and optionally the hour as well. e.g. 2022-01-15T00:00:00.000Z
 */
export function getToday(useHours = true) {
  const now = new Date();
  if (!useHours) {
    now.setUTCHours(0);
  }
  now.setUTCMinutes(0);
  now.setUTCSeconds(0);
  now.setUTCMilliseconds(0);
  return now.toISOString();
}
