import { Bot } from '@/types';

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

export function camelCaseToNormal(str: string) {
  const splitCapital = str.replace(/([A-Z])/g, ' $1');
  return splitCapital[0].toUpperCase() + splitCapital.slice(1);
}

export function formatPercent(fractional: number, decimals = 2) {
  return `${(fractional * 100).toFixed(decimals)}%`;
}

export function joinNaturally(array: string[]) {
  if (array.length <= 2) {
    return array.join(' and ');
  } else {
    array[array.length - 1] = 'and ' + array[array.length - 1];
    return array.join(', ');
  }
}

export function resolveEmoji(emoji: string, bot: Bot) {
  const isEmojiResolvable = !emoji.startsWith('<') || bot.emojis.resolve(emoji);
  return isEmojiResolvable ? emoji : `:${emoji.split(':')[1]}:`;
}
