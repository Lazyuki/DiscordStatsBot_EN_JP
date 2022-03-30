import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { errorEmbed, successEmbed, warningEmbed } from '@utils/embed';
import { idToUser } from '@utils/guildUtils';
import { isOrAre } from '@utils/pluralize';
import { GuildMember } from 'discord.js';

const command: BotCommand = {
  name: 'kick',
  isAllowed: ['SERVER_MODERATOR'],
  description: 'Kick people off this server.',
  requiredBotPermissions: ['KICK_MEMBERS'],
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'kick @Geralt being too good at Japanese',
    'kick 284840842026549259 299335689558949888 low effort trolls',
  ],
  normalCommand: async ({ bot, content, server, message }) => {
    const { members, nonMemberIds, restContent } = parseMembers(
      content,
      server.guild,
      'MEMBERS'
    );
    if (nonMemberIds.length) {
      throw new CommandArgumentError(
        `${nonMemberIds.map(idToUser).join(' ')} ${isOrAre(
          nonMemberIds.length
        )} not in this server`
      );
    }
    const auditLogReason = `By ${message.author.username} (${
      message.author.id
    }) Reason: ${restContent.replace('\n', ' ') || 'Unspecified'}`;
    if (auditLogReason.length > 512) {
      await message.channel.send(
        warningEmbed(
          `The kick reason exceeds the limit of 512 characters: \`${auditLogReason.length}\` characters.`
        )
      );
      return;
    }
    const kicked: GuildMember[] = [];
    for (const member of members) {
      if (member.kickable) {
        await member.kick(auditLogReason);
        kicked.push(member);
      } else {
        await message.channel.send(errorEmbed(`Failed to kick ${member}`));
      }
    }
    if (kicked.length) {
      await message.channel.send(successEmbed(`Kicked ${kicked.join(' ')}`));
    }
  },
};

export default command;
