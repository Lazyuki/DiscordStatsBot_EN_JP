export function codeBlock(str: string, lang: string = '') {
  const lines = str.split('\n');
  if (lines[0].startsWith('```')) {
    // If it already is a code block, remove the code block
    str = lines.slice(1, lines.length - 1).join('\n');
  }
  return '```' + `${lang}\n` + str + '\n```';
}

export function appendCodeBlock(str: string, addition: string) {
  const lines = str.split('\n');
  if (lines[0].startsWith('```')) {
    str = lines.slice(1, lines.length - 1).join('\n');
  }
  str += '\n' + addition;
  return lines[0] + '\n' + str + '\n```';
}

export function code(str: string) {
  return `\`${str}\``;
}
