import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { errorEmbed, successEmbed } from '@utils/embed';

const unban: BotCommand = {
  name: 'unban',
  isAllowed: ['BanMembers', 'MAINICHI_COMMITTEE'],
  requiredBotPermissions: ['BanMembers'],
  description: 'Unban users',
  arguments: '<user ID> [user2 ID...] [reason]',
  examples: ['unban 123454323454 2345432345643 4543246543234'],
  parentCommand: 'ban',
  normalCommand: async ({ content, message, server }) => {
    const { members, nonMemberIds, restContent } = parseMembers(
      content,
      server.guild
    );
    if (members.length && members.every((m) => m.joinedAt)) {
      throw new CommandArgumentError(
        `${members.join(', ')} already in the server.`
      );
    }
    if (nonMemberIds.length === 0) {
      if (members.length) {
        // member is still cached
        members.forEach((m) => {
          if (!m.joinedAt) {
            nonMemberIds.push(m.id);
          }
        });
      } else {
        throw new CommandArgumentError('Please specify IDs of users to unban');
      }
    }
    const reason = `By ${message.author.tag} (${message.author.id}). Reason: ${
      restContent || 'Unspecified'
    }`;
    for (const userId of nonMemberIds) {
      try {
        await server.guild.members.unban(userId, reason);
        await message.channel.send(successEmbed(`User <@${userId}> unbanned.`));
      } catch (e) {
        await message.channel.send(
          errorEmbed(
            `Unbanning ${userId} failed. Make sure the user ID is correct.`
          )
        );
      }
    }
  },
};

export default unban;
