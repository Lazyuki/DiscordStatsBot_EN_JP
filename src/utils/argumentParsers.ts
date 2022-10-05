import { CategoryChannel, ForumChannel, Guild, GuildMember } from 'discord.js';
import Server from '@classes/Server';
import { REGEX_MESSAGE_LINK_OR_FULL_ID, REGEX_RAW_ID } from './regex';
import { Bot, GuildTextChannel, GuildTextParentChannel } from '@/types';
import { CommandArgumentError, MemberNotFoundError } from '@/errors';
import { getTextChannel, isTextChannel } from './guildUtils';
import { joinNaturally } from './formatString';

/**
 *
 * @param str string with snowflake IDs
 * @param greedy if set to false, it will stop when it first encounters a non-snowflake-ID word. Otherwise it will get all snowflake IDs wherever they appear in the string.
 * @returns { ids: string[], rest: string } parsed IDs and also the rest of the string with IDs stripped out.
 */
export function parseSnowflakeIds(str: string, greedy = false) {
  const words = str.match(/[^\s>]+[\s>]*|\S/g) || [];
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

  return { ids, rest: nonIds.join('') };
}

export function parseChannels(
  content: string,
  guild: Guild
): {
  channels: GuildTextParentChannel[];
  textChannels: GuildTextChannel[];
  categories: CategoryChannel[];
  channelsAndCategories: (GuildTextParentChannel | CategoryChannel)[];
  nonChannelIds: string[];
  allIds: string[];
  restContent: string;
} {
  const words = content.match(/[^\s>]+[\s>]*|\S/g) || [];
  const channels: GuildTextParentChannel[] = [];
  const textChannels: GuildTextChannel[] = [];
  const categories: CategoryChannel[] = [];
  const nonChannelIds: string[] = [];
  const allIds: string[] = [];

  for (const word of words) {
    const idMatch = word.match(REGEX_RAW_ID);
    if (idMatch && idMatch.length === 1) {
      const id = idMatch[0];
      allIds.push(id);
      const channel = guild.channels.cache.get(id);
      if (channel && isTextChannel(channel)) {
        textChannels.push(channel);
        channels.push(channel);
      } else if (channel && channel instanceof CategoryChannel) {
        categories.push(channel);
      } else if (channel && channel instanceof ForumChannel) {
        channels.push(channel);
      } else {
        nonChannelIds.push(id);
      }
    } else {
      break;
    }
  }

  return {
    channels,
    textChannels,
    categories,
    channelsAndCategories: [...channels, ...categories],
    nonChannelIds,
    allIds,
    restContent: words.slice(allIds.length).join(''),
  };
}

/**
 *
 * Parse Members or IDs from the front of the content. If it sees a non-ID word the parsing stops.
 * @param content string to parse
 * @param server server
 * @param required "MEMBER" | "ID". if specified, throw an error if member is not found or id is not found
 * @returns {
 *  members: Member[], // Guild Members
 *  nonMemberIds: string[], // Possible IDs that aren't in the guild
 *  allIds: string[], // members.id and nonMemberIDs combined.
 *  restContent: string, // rest of the content
 * }
 */
export function parseMembers(
  content: string,
  guild: Guild,
  required?: 'MEMBERS' | 'MEMBER' | 'ID' | 'IDS',
  allowBots = false
): {
  members: GuildMember[];
  nonMemberIds: string[];
  allIds: string[];
  restContent: string;
} {
  const words = content.match(/[^\s>]+[\s>]*|\S/g) || [];

  const members: GuildMember[] = [];
  const nonMemberIds: string[] = [];
  const allIds: string[] = [];

  for (const word of words) {
    const idMatch = word.match(REGEX_RAW_ID);
    if (idMatch && idMatch.length === 1) {
      const id = idMatch[0];
      allIds.push(id);
      const member = guild.members.cache.get(id);
      if (member && (allowBots || !member.user.bot)) {
        members.push(member);
      } else {
        nonMemberIds.push(id);
      }
    } else {
      break;
    }
  }

  if (allIds.length === 0 && /^.+#[0-9]{4}\s*$/.test(words[0])) {
    // using user tag?
    const tagMember = guild.members.cache.find(
      (v) => v.user.tag === words[0].trim()
    );
    if (tagMember) {
      members.push(tagMember);
      allIds.push(tagMember.id);
    }
  }

  if (members.length === 0 && required?.startsWith('MEMBER')) {
    throw new CommandArgumentError(
      required === 'MEMBER'
        ? 'Please mention or specify a valid member in this server'
        : 'Please mention or specify valid members who are in this server'
    );
  }
  if (allIds.length === 0 && required?.startsWith('ID')) {
    throw new CommandArgumentError(
      required === 'ID'
        ? 'Please mention or specify a user ID'
        : 'Please mention or specify user IDs'
    );
  }

  return {
    members,
    nonMemberIds,
    allIds,
    restContent: words.slice(allIds.length).join(''),
  };
}

export function strictGetUserId(content: string, guild: Guild) {
  const idMatch = content.match(REGEX_RAW_ID);
  if (idMatch) {
    // Snowflake ID
    return idMatch[0];
  } else {
    const userTag = content.match(/^(.+#[0-9]{4})$/)?.[0];
    if (userTag) {
      const hasAt = userTag[0] === '@'; // Make sure there is no ambiguity
      const nonAtUserTag = userTag.substring(1);
      const matches: string[] = [];
      for (const member of guild.members.cache.values()) {
        if (member.user.tag === userTag) {
          if (hasAt) return member.id;
          matches.push(member.id);
        } else if (hasAt && member.user.tag === nonAtUserTag) {
          matches.push(member.id);
        }
      }
      if (matches.length === 1) {
        return matches[0];
      } else if (matches.length > 1) {
        throw new CommandArgumentError(`The user tag ${userTag} is ambiguous`);
      }
    }
  }
}

export const getMemberId = (bot: Bot, server: Server, content: string) =>
  getUserId(bot, server, content, true);

/**
 *
 * If snowflake ID, return the ID.
 * If name, search a member with the name and return
 * @param bot
 * @param server
 * @param content
 * @param forceMember
 * @returns
 */
export const getUserId = (
  bot: Bot,
  server: Server,
  content: string,
  forceMember?: boolean
) => {
  const idMatch = content.match(REGEX_RAW_ID);
  if (idMatch) {
    // Snowflake ID
    const userId = idMatch[0];
    if (forceMember) {
      if (server.guild.members.cache.get(userId)) {
        return userId;
      } else {
        throw new MemberNotFoundError();
      }
    }
    return userId;
  } else if (content) {
    const exactMatches = [];
    const startsWith = [];
    const includes = [];
    // search by name
    const useRegex =
      content.length > 3 &&
      content.startsWith('/') &&
      (content.endsWith('/') || content.endsWith('/i'));
    const regex = useRegex
      ? new RegExp(
          content.slice(1, content.length - 1),
          content.endsWith('/i') ? 'i' : ''
        )
      : null;

    const members = server.guild.members.cache.values();
    for (const member of members) {
      if (member.user.bot) continue;
      if (regex) {
        if (
          regex.test(member.displayName) ||
          regex.test(member.user.username)
        ) {
          exactMatches.push(member);
        }
      } else {
        const nickname = member.nickname || '';
        const username = member.user.username;
        const nicknameLower = nickname.toLowerCase();
        const usernameLower = username.toLowerCase();
        const userTag = member.user.tag;
        if (userTag === content || `@${userTag}` === content) return member.id; // Exact tag match
        if (
          username === content ||
          nickname === content ||
          usernameLower === content ||
          nicknameLower === content
        ) {
          exactMatches.push(member);
        } else if (
          userTag.startsWith(content) ||
          nickname.startsWith(content) ||
          usernameLower.startsWith(content) ||
          nicknameLower.startsWith(content)
        ) {
          startsWith.push(member);
        } else if (
          userTag.includes(content) ||
          nickname.includes(content) ||
          usernameLower.includes(content) ||
          nicknameLower.includes(content)
        ) {
          includes.push(member);
        }
      }
    }
    // TODO: Sort by number of messages?
    if (exactMatches.length) {
      return exactMatches[0].id;
    } else if (startsWith.length) {
      return startsWith[0].id;
    } else if (includes.length) {
      return includes[0].id;
    } else {
      // Something in content but no user found
      throw new MemberNotFoundError(content);
    }
  }
  // content is empty
  return null;
};

export function parseSubCommand(
  content: string,
  availableSubCommands?: string[]
) {
  const subCommand = content.split(' ')[0];
  const restContent = content.replace(subCommand, '').trim();
  if (availableSubCommands) {
    if (!availableSubCommands.includes(subCommand.toLowerCase())) {
      throw new CommandArgumentError(
        `The available sub commands are: ${joinNaturally(availableSubCommands)}`
      );
    }
  }
  return {
    subCommand: subCommand.toLowerCase(),
    restContent,
  };
}

export async function parseMessageId(content: string, guild: Guild) {
  const linkMatch = content.match(REGEX_MESSAGE_LINK_OR_FULL_ID);
  if (!linkMatch) {
    throw new CommandArgumentError(
      `Please provide a valid message link or a full ID`
    );
  }
  const [_, channelId, messageId] = linkMatch;
  const channel = getTextChannel(guild, channelId);
  if (!channel)
    throw new CommandArgumentError(`Invalid Channel ID ${channelId}`);
  const message = await channel.messages.fetch(messageId);
  if (!message)
    throw new CommandArgumentError(`Invalid Message ID ${messageId}`);
  return message;
}
