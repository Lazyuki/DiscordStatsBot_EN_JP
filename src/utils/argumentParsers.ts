import { Message } from 'discord.js';
import Server from 'classes/Server';
import { REGEX_RAW_ID, REGEX_RAW_ID_ONLY, REGEX_USER } from './regex';

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
