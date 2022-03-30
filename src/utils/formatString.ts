import { Bot } from '@/types';
import { User, Util } from 'discord.js';

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
  const splitCapital = str.replace(/([A-Z])/g, ' $1'); // This splits acronyms as well
  let acronymSafeStr = '';
  let lastCapital = false;
  splitCapital.split(' ').forEach((word) => {
    if (word.length === 1) {
      // one letter means continuous capital
      acronymSafeStr += word;
      lastCapital = true;
    } else {
      if (lastCapital) {
        acronymSafeStr += ' ' + word + ' ';
      } else {
        acronymSafeStr += word + ' ';
      }
      lastCapital = false;
    }
  });
  acronymSafeStr = acronymSafeStr.trim();
  return acronymSafeStr[0].toUpperCase() + acronymSafeStr.slice(1);
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

export function escapeRegex(regex: string) {
  return regex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function resolveEmoji(emoji: string, bot: Bot) {
  const isEmojiResolvable = !emoji.startsWith('<') || bot.emojis.resolve(emoji);
  return isEmojiResolvable ? emoji : `:${emoji.split(':')[1]}:`;
}

export function userToMentionAndTag(user: User) {
  return `${user.toString()} (${Util.escapeMarkdown(user.tag)})`;
}

export function userToTagAndId(user: User) {
  return `${Util.escapeMarkdown(user.tag)} (${user.id})`;
}
