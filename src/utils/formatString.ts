import { Bot } from '@/types';
import { Guild, User, escapeMarkdown } from 'discord.js';

export function codeBlock(str: string, lang: string = '') {
  const lines = str.split('\n');
  if (lines[0].startsWith('```')) {
    // If it already is a code block, remove the code block
    str = lines.slice(1, lines.length - 1).join('\n');
  }
  return '```' + `${lang}\n` + str + '\n```';
}

export function appendCodeBlock(str: string, addition: string, limit?: number) {
  const [firstLine, ...restLines] = str.split('\n');
  if (firstLine.startsWith('```')) {
    str = restLines.slice(0, restLines.length - 1).join('\n');
  }
  str += '\n' + addition;
  const otherLength = firstLine.length + 5;
  if (limit && str.length + otherLength > limit) {
    const start = str.length + otherLength - limit;
    str = str.slice(start); // Since we are appending code block, remove from the top
  }
  return firstLine + '\n' + str + '\n```';
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
  const discordEmoji = emoji.startsWith('<');
  if (discordEmoji) {
    const [animated, name, id] = emoji.slice(1, emoji.length - 1).split(':');
    const isEmojiResolvable = bot.emojis.resolve(id);
    return isEmojiResolvable ? emoji : `${animated}:${name}:`;
  } else {
    return emoji;
  }
}

export function getServerEmoji(emoji: string, guild: Guild) {
  const discordEmoji = emoji.startsWith('<');
  if (discordEmoji) {
    const [animated, name, id] = emoji.slice(1, emoji.length - 1).split(':');
    return guild.emojis.resolve(id);
  } else {
    return null;
  }
}

export function userToMentionAndTag(user: User) {
  return `${user.toString()} (${escapeMarkdown(user.tag)})`;
}

export function userToMentionAndTagNoEscape(user: User) {
  return `${user.toString()} (${user.tag})`;
}

export function userToTagAndId(user: User) {
  return `${escapeMarkdown(user.tag)} (${user.id})`;
}

export function userToTagAndIdNoEscape(user: User) {
  return `${user.tag} (${user.id})`;
}

export function pseudoShlexSplit(text: string) {
  const escaped = text.replaceAll('\\"', '{ESCAPED_QUOTE}');
  const splitByQuotes = escaped.split('"');
  const spaceReplaced = splitByQuotes
    .map((s, i) =>
      i % 2 === 1 && splitByQuotes.length - 1 !== i
        ? s.replaceAll(' ', '{ESCAPED_SPACE}')
        : s
    )
    .join('"');
  const splitBySpace = spaceReplaced.split(' ');
  return splitBySpace.map((s) =>
    s.replaceAll('{ESCAPED_QUOTE}', '\\"').replaceAll('{ESCAPED_SPACE}', ' ')
  );
}
