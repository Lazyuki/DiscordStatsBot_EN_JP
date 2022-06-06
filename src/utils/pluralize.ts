export function pluralize(
  word: string,
  pluralSuffix: string,
  length: number = 0,
  singularSuffix: string = ''
) {
  return `${word}${length === 1 ? singularSuffix : pluralSuffix}`;
}

export function isOrAre(length: number = 0) {
  return length === 1 ? 'is' : 'are';
}

export function pluralCount(
  word: string,
  pluralSuffix: string,
  length: number = 0,
  singularSuffix: string = ''
) {
  return `${length} ${word}${length === 1 ? singularSuffix : pluralSuffix}`;
}

export function nth(n: number) {
  if (n === 0) return `N/A`;
  switch (n % 10) {
    case 1:
      return String(n).endsWith('11') ? `${n}th` : `${n}st`;
    case 2:
      return String(n).endsWith('12') ? `${n}th` : `${n}nd`;
    case 3:
      return String(n).endsWith('13') ? `${n}th` : `${n}rd`;
    default:
      return `${n}th`;
  }
}
