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
