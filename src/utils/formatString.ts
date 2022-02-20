export function codeBlock(str: string, lang: string = '') {
  return '```' + `${lang}\n` + str + '\n```';
}

export function code(str: string) {
  return `\`${str}\``;
}
