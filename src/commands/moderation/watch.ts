import { CommandArgumentError, UserNotFoundError } from '@/errors';
import { BotCommand } from '@/types';
import {
  getWatched,
  deleteWatched,
  dbInsertWatchedUser,
} from '@database/statements';
import { errorEmbed, successEmbed, warningEmbed } from '@utils/embed';
import pluralize from '@utils/pluralize';
import { REGEX_RAW_ID } from '@utils/regex';
import { User } from 'discord.js';

declare module '@/types' {
  interface ServerCache {
    watched: string[];
  }
}

const watch: BotCommand = {
  name: 'watch',
  isAllowed: 'ADMIN',
  onCommandInit: (server) => {
    const res = getWatched.all({ guildId: server.guild.id });
    server.cache.watched = res as string[];
  },
  description: 'Watch a user for deleted messages',
  arguments: '<@user>',
  childCommands: ['watched', 'unwatch'],
  hidden: true,
  normalCommand: async ({ commandContent, message, server, send }) => {
    if (!commandContent) {
      throw new CommandArgumentError(
        'Please specify a user with an ID or mention them'
      );
    }
    const mentions = message.mentions.users;
    let user: User;
    if (mentions.size > 0) {
      user = mentions.first()!;
    } else {
      const member = server.guild.members.cache.get(commandContent);
      if (!member) {
        throw new UserNotFoundError(commandContent);
      }
      user = member.user;
    }
    if (user.bot) {
      await send(errorEmbed(`Bots cannot be watched!`));
      return;
    }

    if (server.cache.watched.includes(user.id)) {
      await send(
        warningEmbed(`${user} (${user.tag}) is already being watched`)
      );
    } else {
      server.cache.watched.push(user.id);
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
  isAllowed: 'ADMIN',
  description: 'Unwatch a userr',
  arguments: '<@user> <@user2>',
  parentCommand: 'watch',
  hidden: true,
  normalCommand: async ({ commandContent, message, server, send }) => {
    if (!commandContent) {
      throw new CommandArgumentError('Please specify users or ');
    }
    const userIDs = commandContent.match(REGEX_RAW_ID);
    if (!userIDs) {
      throw new CommandArgumentError(
        'Please specify users with IDs or mentions'
      );
    }
    const successIDs: string[] = [];
    const failIDs: string[] = [];

    for (const id of userIDs) {
      if (server.cache.watched.includes(id)) {
        successIDs.push(id);
        deleteWatched.run({ guildId: server.guild.id, userId: id });
      } else {
        failIDs.push(id);
      }
    }

    const res = getWatched.all({ guildId: server.guild.id });
    server.cache.watched = res as string[];

    if (successIDs.length) {
      await message.channel.send(
        successEmbed(
          `Successfully unwatched ${successIDs
            .map((id) => `<@${id}>`)
            .join(' ')}`
        )
      );
    }
    if (failIDs.length) {
      await message.channel.send(
        errorEmbed(
          `${pluralize('User', 's', failIDs.length)} ${failIDs
            .map((id) => `<@${id}>`)
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
  isAllowed: 'ADMIN',
  description: 'List watched users',
  parentCommand: 'watch',
  hidden: true,
  normalCommand: async ({ send, server }) => {
    await send(server.cache.watched.map((w) => `<@${w}>`).join(' '));
  },
};
export default [watch, unwatch, watched];
