export default function pluralize(
  word: string,
  pluralSuffix: string,
  length: number = 0,
  singularSuffix: string = ''
) {
  if (length === 0) {
    return `${word}${singularSuffix}`;
  } else {
    return `${word}${pluralSuffix}`;
  }
}
