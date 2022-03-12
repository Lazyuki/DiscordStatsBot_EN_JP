import { CommandArgumentError, UserNotFoundError } from '@/errors';
import { BotCommand } from '@/types';
import { errorEmbed, successEmbed, warningEmbed } from '@utils/embed';
import { User } from 'discord.js';

declare module '@/types' {
  interface ServerConfig {
    watched: string[];
  }
}

const command: BotCommand = {
  name: 'watch',
  isAllowed: 'ADMIN',
  onCommandInit: (config) => {
    config.watched ||= [];
  },
  description: 'Watch a user for deleted messages',
  arguments: '<@person>',
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

    if (server.config.watched.includes(user.id)) {
      await send(
        warningEmbed(`${user} (${user.tag}) is already being watched`)
      );
    } else {
      server.config.watched.push(user.id);
      await send(
        successEmbed(
          `${user} (${user.tag}) is now being watched for deleted messages`
        )
      );
    }
  },
};

export default command;
