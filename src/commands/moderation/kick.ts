import { CommandArgumentError } from '@/errors';
import { BotCommand, GuildMessage } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { waitForKickConfirm } from '@utils/asyncCollector';
import { BLACK } from '@utils/constants';
import { memberJoinAge } from '@utils/datetime';
import {
  editEmbed,
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { code } from '@utils/formatString';
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
  normalCommand: async ({ content, server, message }) => {
    const { members, nonMemberIds, restContent } = parseMembers(
      content,
      server.guild,
      'MEMBERS',
      true
    );
    if (nonMemberIds.length) {
      throw new CommandArgumentError(
        `${nonMemberIds.map(idToUser).join(' ')} ${isOrAre(
          nonMemberIds.length
        )} not in this server`
      );
    }

    if (members.some((m) => !m.kickable)) {
      throw new CommandArgumentError(`They aren't kickable`);
    }

    const noReason = !restContent;
    const reason = restContent || 'Unspecified';

    const auditLogReason = `By ${message.author.tag} (${message.author.id}) Reason: ${reason}`;
    if (auditLogReason.length > 512) {
      await message.channel.send(
        warningEmbed(
          `The kick reason exceeds the limit of 512 characters: \`${auditLogReason.length}\` characters.`
        )
      );
      return;
    }

    const allowedConfirmMessages = noReason
      ? ['confirm']
      : ['confirm dm', 'confirm silent'];

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

        __Reason__: ${reason}

        Type ${allowedConfirmMessages.map(code).join(', ')} or \`cancel\` 
        `,
        color: BLACK,
      })
    );

    const response = await waitForKickConfirm(
      kickConfirmation as GuildMessage,
      message.author.id,
      noReason
    );
    if (response === 'CANCEL') {
      await editEmbed(kickConfirmation, { footer: 'Cancelled' });
      await message.channel.send(errorEmbed('Cancelled'));
      return;
    }

    const kicked: GuildMember[] = [];
    const dmFailed: GuildMember[] = [];

    for (const member of members) {
      if (response === 'DM') {
        try {
          await member.send(
            makeEmbed({
              title: `You have been kicked from ${server.guild}`,
              description: `Reason: ${reason}`,
            })
          );
        } catch (e) {
          await message.channel.send(
            errorEmbed(`Failed to DM the reason to ${member}`)
          );
          dmFailed.push(member);
        }
      }
      try {
        await member.kick(auditLogReason);
        kicked.push(member);
      } catch (e) {
        await message.channel.send(errorEmbed(`Failed to kick ${member}`));
      }
    }
    if (kicked.length) {
      const dmString =
        response === 'DM' && dmFailed.length === 0
          ? ' and DMed the reason'
          : '';
      await editEmbed(kickConfirmation, { footer: 'Kicked' });
      await message.channel.send(
        successEmbed(`Kicked ${kicked.join(' ')}${dmString}`)
      );
    }
  },
};

export default command;
