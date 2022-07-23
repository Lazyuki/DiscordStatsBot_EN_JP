import { CommandArgumentError, UserPermissionError } from '@/errors';
import { BotCommand } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { successEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'changeName',
  aliases: ['cn', 'cyn'],
  isAllowed: ['SERVER_MODERATOR'],
  requiredBotPermissions: ['ManageNicknames'],
  description: 'Set the nickname to "Please change your name"',
  arguments: '<@user> [@user2...]',
  examples: ['cyn @badNameUser'],
  normalCommand: async ({ message, content, server }) => {
    const { members } = parseMembers(content, server.guild, 'MEMBERS');
    if (!members.every((m) => m.manageable)) {
      throw new UserPermissionError(`Their roles are higher than mine`);
    }
    for (const member of members) {
      await member.setNickname(
        'Please change your name',
        `Issued by ${message.author.tag} (${message.author.id})`
      );
    }
    await message.channel.send(
      successEmbed(`Successfully changed their nickname`)
    );
  },
};

export default command;
