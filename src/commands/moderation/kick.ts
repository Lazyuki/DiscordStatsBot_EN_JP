import { CommandArgumentError } from '@/errors';
import { BotCommand, GuildMessage } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { waitForConfirmOrCancel } from '@utils/asyncMessageCollector';
import { BLACK } from '@utils/constants';
import { memberJoinAge } from '@utils/datetime';
import {
  editEmbed,
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { idToUser } from '@utils/guildUtils';
import { isOrAre } from '@utils/pluralize';
import { stripIndents } from 'common-tags';
import { GuildMember } from 'discord.js';

const command: BotCommand = {
  name: 'kick',
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description: 'Kick people off this server.',
  requiredBotPermissions: ['KICK_MEMBERS'],
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'kick @Geralt bye',
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
    const reason = restContent || 'Unspecified';

    const auditLogReason = `By ${message.author.username} (${message.author.id}) Reason: ${reason}`;
    if (auditLogReason.length > 512) {
      await message.channel.send(
        warningEmbed(
          `The kick reason exceeds the limit of 512 characters: \`${auditLogReason.length}\` characters.`
        )
      );
      return;
    }

    const kickConfirmation = await message.channel.send(
      makeEmbed({
        title: 'KICK',
        description: stripIndents`
        ${members
          .map(
            (member) =>
              `${member}: ${member.user.tag} ${memberJoinAge(member, 7)}`
          )
          .join('\n')}

        __Reason__ (They will NOT receive the reason): ${reason}

        Type \`confirm\` or \`cancel\` 
        `,
        color: BLACK,
      })
    );

    const confirm = await waitForConfirmOrCancel(
      kickConfirmation as GuildMessage,
      message.author.id,
      45,
      true
    );
    if (!confirm) {
      await editEmbed(kickConfirmation, { footer: 'Cancelled' });
      await message.channel.send(errorEmbed('Cancelled'));
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
      await editEmbed(kickConfirmation, { footer: 'Kicked' });
      await message.channel.send(successEmbed(`Kicked ${kicked.join(' ')}`));
    }
  },
};

export default command;
