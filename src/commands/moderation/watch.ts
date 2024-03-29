import { CommandArgumentError, MemberNotFoundError } from '@/errors';
import { BotCommand } from '@/types';
import {
  getWatched,
  deleteWatched,
  insertWatchedUser,
} from '@database/statements';
import {
  errorEmbed,
  infoEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { userToMentionAndTag } from '@utils/formatString';
import { idToUser } from '@utils/guildUtils';
import { descriptionPaginator } from '@utils/paginate';
import { pluralCount, pluralize } from '@utils/pluralize';
import { REGEX_RAW_ID } from '@utils/regex';
import { User } from 'discord.js';

declare module '@/types' {
  interface ServerTemp {
    watched: string[];
  }
}

const watch: BotCommand = {
  name: 'watch',
  isAllowed: ['SERVER_MODERATOR'],
  onCommandInit: (server) => {
    const res = getWatched({ guildId: server.guild.id });
    server.temp.watched = res.map((row) => row.userId) || [];
  },
  description: 'Watch a user for deleted messages',
  arguments: '<@user>',
  childCommands: ['watched', 'unwatch', 'watchClean'],
  hidden: true,
  normalCommand: async ({ content, message, server, send }) => {
    if (!content) {
      throw new CommandArgumentError(
        'Please specify a user with an ID or mention them'
      );
    }
    const mentions = message.mentions.users;
    let user: User;
    if (mentions.size > 0) {
      user = mentions.first()!;
    } else {
      const member = server.guild.members.cache.get(content);
      if (!member) {
        throw new MemberNotFoundError(content);
      }
      user = member.user;
    }
    if (user.bot) {
      await send(errorEmbed(`Bots cannot be watched!`));
      return;
    }

    if (server.temp.watched.includes(user.id)) {
      await send(infoEmbed(`${user} (${user.tag}) is already being watched`));
    } else {
      insertWatchedUser({ guildId: server.guild.id, userId: user.id });
      server.temp.watched.push(user.id);
      await send(
        successEmbed(
          `${user} (${user.tag}) is now being watched for deleted messages`
        )
      );
    }
  },
};

const unwatch: BotCommand = {
  name: 'unwatch',
  isAllowed: ['SERVER_MODERATOR'],
  description: 'Unwatch a userr',
  arguments: '<@user> <@user2>',
  parentCommand: 'watch',
  hidden: true,
  normalCommand: async ({ content, message, server, send }) => {
    if (!content) {
      throw new CommandArgumentError('Please specify users or ');
    }
    const userIDs = content.match(REGEX_RAW_ID);
    if (!userIDs) {
      throw new CommandArgumentError(
        'Please specify users with IDs or mentions'
      );
    }
    const successIDs: string[] = [];
    const failIDs: string[] = [];

    for (const id of userIDs) {
      if (server.temp.watched.includes(id)) {
        if (successIDs.includes(id)) continue;
        successIDs.push(id);
        deleteWatched({ guildId: server.guild.id, userId: id });
      } else {
        failIDs.push(id);
      }
    }

    const res = getWatched({ guildId: server.guild.id });
    server.temp.watched = res.map((row) => row.userId);

    if (successIDs.length) {
      await message.channel.send(
        successEmbed(
          `Successfully unwatched ${successIDs.map(idToUser).join(' ')}`
        )
      );
    }
    if (failIDs.length) {
      await message.channel.send(
        errorEmbed(
          `${pluralize('User', 's', failIDs.length)} ${failIDs
            .map(idToUser)
            .join(' ')} ${pluralize(
            '',
            'were',
            failIDs.length,
            'was'
          )} not watched`
        )
      );
    }
  },
};

const watched: BotCommand = {
  name: 'watched',
  isAllowed: ['SERVER_MODERATOR'],
  description: 'List watched users',
  parentCommand: 'watch',
  hidden: true,
  normalCommand: async ({ bot, server, message }) => {
    const watchedReverse = [...server.temp.watched].reverse();
    await descriptionPaginator(
      message.channel,
      `List of watched users (${pluralCount(
        'user',
        's',
        server.temp.watched.length
      )})`,
      watchedReverse.map((id) => {
        const user = bot.users.cache.get(id);
        if (user) {
          return userToMentionAndTag(user);
        } else {
          return `User ID: ${id}`;
        }
      }),
      50,
      message.author.id
    );
  },
};

const watchClean: BotCommand = {
  name: 'watchClean',
  isAllowed: ['SERVER_MODERATOR'],
  description:
    'Clean the list of watched users by removing users who are no longer in the server',
  parentCommand: 'watch',
  hidden: true,
  normalCommand: async ({ send, server }) => {
    const removed: string[] = [];
    server.temp.watched = server.temp.watched.filter((userId) => {
      if (!server.guild.members.cache.has(userId)) {
        removed.push(userId);
        deleteWatched({ guildId: server.guild.id, userId });
        return false;
      }
      return true;
    });
    if (removed.length) {
      await send(successEmbed(`Cleared ${removed.length} users`));
    } else {
      await send(infoEmbed('All watched users are still in the server.'));
    }
  },
};

export default [watch, unwatch, watched, watchClean];
