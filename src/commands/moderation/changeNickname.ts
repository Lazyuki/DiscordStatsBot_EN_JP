import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { successEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'changenick',
  aliases: ['cn', 'cyn'],
  isAllowed: 'SERVER_MODERATOR',
  description: 'Set the nickname to "Please change your name"',
  arguments: '<@user> [@user2...]',
  examples: ['cyn @badNameUser'],
  normalCommand: async ({ message, content, server }) => {
    const { members } = parseMembers(content, server.guild);
    if (members.length === 0) {
      throw new CommandArgumentError(`Please specify valid users`);
    }
    for (const member of members) {
      await member.setNickname(
        'Please change your name',
        `Issued by ${message.author.tag} (${message.author.id})`
      );
    }
    await message.channel.send(successEmbed(`Successfully changed nickname`));
  },
};

export default command;
