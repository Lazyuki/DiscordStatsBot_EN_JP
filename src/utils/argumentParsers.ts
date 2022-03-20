import { Guild, GuildMember, Message } from 'discord.js';
import Server from '@classes/Server';
import { REGEX_RAW_ID, REGEX_RAW_ID_ONLY, REGEX_USER } from './regex';

/**
 *
 * @param str string with snowflake IDs
 * @param greedy if set to false, it will stop when it first encounters a non-snowflake-ID word. Otherwise it will get all snowflake IDs wherever they appear in the string.
 * @returns { ids: string[], rest: string } parsed IDs and also the rest of the string with IDs stripped out.
 */
export function parseSnowflakeIds(str: string, greedy = false) {
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

/**
 *
 * Parse Members or IDs from the front of the content. If it sees a non-ID word the parsing stops.
 * @param content string to parse
 * @param server server
 * @returns {
 *  members: Member[], // Guild Members
 *  nonMemberIds: string[], // Possible IDs that aren't in the guild
 *  allIds: string[], // members.id and nonMemberIDs combined.
 *  restContent: string, // rest of the content
 * }
 */
export function parseMembers(
  content: string,
  guild: Guild
): {
  members: GuildMember[];
  nonMemberIds: string[];
  allIds: string[];
  restContent: string;
} {
  const words = content.split(/\s+/);

  const members: GuildMember[] = [];
  const nonMemberIds: string[] = [];
  const allIds: string[] = [];

  for (const word of words) {
    const idMatch = word.match(REGEX_RAW_ID);
    if (idMatch && idMatch.length === 1) {
      const id = idMatch[0];
      allIds.push(id);
      const member = guild.members.cache.get(id);
      if (member) {
        members.push(member);
      } else {
        nonMemberIds.push(id);
      }
    } else {
      break;
    }
  }

  return {
    members,
    nonMemberIds,
    allIds,
    restContent: words.slice(allIds.length).join(' '),
  };
}

export function parseChannels(
  message: Message,
  content: string,
  server: Server
) {}
