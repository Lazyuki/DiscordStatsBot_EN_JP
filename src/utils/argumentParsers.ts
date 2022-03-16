import { Message } from 'discord.js';
import Server from '@classes/Server';
import { REGEX_RAW_ID, REGEX_RAW_ID_ONLY, REGEX_USER } from './regex';

/**
 *
 * @param str string with snowflake IDs
 * @param greedy if set to false, it will stop when it first encounters a non-snowflake-ID word. Otherwise it will get all snowflake IDs whereever they appear in the string.
 * @returns { ids: string[], rest: string } parsed IDs and also the rest of the string with IDs stripped out.
 */
export function parseSnowflakeIDs(str: string, greedy = false) {
  const words = str.split(/\s+/);
  const ids: string[] = [];
  const nonIds: string[] = [];
  for (const [i, word] of words.entries()) {
    const match = word.match(REGEX_RAW_ID);
    if (match) {
      ids.push(...match);
    } else {
      if (!greedy) {
        nonIds.push(...words.slice(i));
        break;
      } else {
        nonIds.push(word);
      }
    }
  }

  return { ids, rest: nonIds.join(' ') };
}

// content is command-stripped
export function parseUsers(
  message: Message,
  content: string,
  server: Server
): [string[], string] {
  const words = content.split(/\s+/);
  const userIds: string[] = [];

  function loopWords() {
    for (const word of words) {
      if (REGEX_USER.test(word)) {
        const id = word.match(REGEX_RAW_ID)?.[1];
        if (id) {
          userIds.push(id);
        }
        content = content.replace(word, '');
      } else if (REGEX_RAW_ID_ONLY.test(word)) {
        userIds.push(word);
        content = content.replace(word, '');
      } else {
        break;
      }
    }
  }

  loopWords();
  if (userIds.length === 0) {
    // Maybe users were added at the end of a command
    words.reverse();
    loopWords();
  }
  return [userIds, content.trim()];
}

export function parseChannels(
  message: Message,
  content: string,
  server: Server
) {}
