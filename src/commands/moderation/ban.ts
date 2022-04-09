import { BotCommand, GuildMessage } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import {
  editEmbed,
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { waitForBanConfirm, waitForYesOrNo } from '@utils/asyncCollector';
import { GuildMember } from 'discord.js';
import { BLACK } from '@utils/constants';
import { stripIndents } from 'common-tags';
import { memberJoinAge } from '@utils/datetime';
import { pluralCount, pluralize } from '@utils/pluralize';
import { getTextChannel, idToUser } from '@utils/guildUtils';
import { joinNaturally, userToMentionAndTag } from '@utils/formatString';
import Server from '@classes/Server';
import { getBanConfirmationButtons } from '@utils/buttons';
import { CommandArgumentError } from '@/errors';

const command: BotCommand = {
  name: 'ban',
  isAllowed: ['BAN_MEMBERS', 'MAINICHI_COMMITTEE'],
  requiredBotPermissions: ['BAN_MEMBERS'],
  description:
    'Ban! You can specify multiple users. Or use `raidban` for banning the entire raid party.',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'ban @user being too good at Japanese',
    'ban 284840842026549259 299335689558949888 -d 0',
  ],
  options: [
    {
      name: 'days',
      short: 'd',
      bool: false,
      description: 'Number of days to delete. Default to 1',
    },
  ],
  childCommands: ['unban'],
  normalCommand: async ({ content, message, server, options }) => {
    const executor = message.author;
    let deleteDays = parseInt(String(options['days']) || '');
    if (isNaN(deleteDays)) {
      deleteDays = 1;
    }
    let reason = 'Unspecified';
    const { members, nonMemberIds, allIds, restContent } = parseMembers(
      content,
      server.guild
    );
    if (message.mentions.repliedUser) {
      const member = server.guild.members.cache.get(
        message.mentions.repliedUser.id
      );
      member && members.push(member);
    }
    if (restContent) reason = restContent;
    const unbannables = members.filter((mem) => !mem.bannable);
    if (unbannables.length) {
      await message.channel.send(
        errorEmbed(`${unbannables.join(', ')} cannot be banned`)
      );
      return;
    }

    if (members.length === 0 && nonMemberIds.length === 0) {
      throw new CommandArgumentError('Please specify users to ban');
    }

    let auditLogReason = `By ${executor.tag} (${
      executor.id
    }) Reason: ${reason.replace('\n', ' ')}`;
    if (auditLogReason.length > 512) {
      const questionMessage = await message.channel.send(
        warningEmbed(
          `The ban reason exceeds the limit of 512 characters at \`${auditLogReason.length}\` characters.\n\nDo you want to send the full reason to the person and let Discord's audit log ban reason be truncated?`
        )
      );
      const sendAnyway = await waitForYesOrNo(
        questionMessage as GuildMessage,
        message.author.id
      );
      if (!sendAnyway) {
        await message.channel.send(errorEmbed(`Ban cancelled`));
        return;
      }
      auditLogReason = auditLogReason.slice(0, 512);
    }

    const deleting = deleteDays
      ? `__Deleting__: Messages from the past ${pluralCount(
          'day',
          's',
          deleteDays
        )}\n(type \`confirm keep\` to not delete messages)`
      : `__**NOT DELETING**__ any messages`;

    const banConfirmation = await message.channel.send({
      ...makeEmbed({
        title:
          '<:hypergeralthinkban:443803651325034507> BAN <:hypergeralthinkban:443803651325034507>',
        description: stripIndents`
        ${members
          .map(
            (member) =>
              `${member}: ${member.user.tag} ${memberJoinAge(member, 7)}`
          )
          .join('\n')}${nonMemberIds.length ? '\n' : ''}${nonMemberIds
          .map(idToUser)
          .join('\n')}

        __Reason__: ${reason}

        ${deleting}

        Type ${
          deleteDays !== 0 ? '`confirm delete`, ' : ''
        }\`confirm keep\` or \`cancel\` 
        `,
        color: BLACK,
      }),
      components: getBanConfirmationButtons(deleteDays > 0),
    });

    const response = await waitForBanConfirm(
      banConfirmation as GuildMessage,
      executor.id,
      deleteDays !== 0
    );

    switch (response) {
      case 'DELETE':
      case 'KEEP':
        if (response === 'KEEP') {
          deleteDays = 0;
        }
        const banResult = await banUsers({
          server,
          members,
          nonMemberIds,
          deleteDays,
          reason,
          auditLogReason,
        });
        const { failedBanIds, dmFailedMembers } = banResult;

        const bannedMembers = members.filter(
          (m) => !failedBanIds.includes(m.id)
        );
        const bannedIds = nonMemberIds.filter(
          (id) => !failedBanIds.includes(id)
        );

        const dmFailString = dmFailedMembers.length
          ? `\n\nBut failed to DM: ${joinNaturally(
              dmFailedMembers.map((m) => m.toString())
            )}`
          : '';

        await message.channel.send(
          successEmbed(
            `Banned ${pluralCount(
              'user',
              's',
              bannedMembers.length + bannedIds.length
            )}${dmFailString}`
          )
        );
        await editEmbed(banConfirmation, {
          footer: `Banned ${
            deleteDays === 0
              ? 'but kept the messages'
              : `and deleted messages from the past ${pluralCount(
                  'day',
                  's',
                  deleteDays
                )}`
          }`,
        });
        if (server.config.modActionLogChannel) {
          const modActionLogChannel = getTextChannel(
            server.guild,
            server.config.modActionLogChannel
          );
          await modActionLogChannel?.send(
            makeEmbed({
              title: 'Ban',
              color: BLACK,
              footer: `By ${message.author.tag} in #${message.channel.name}`,
              footerIcon: message.member.displayAvatarURL(),
              fields: [
                {
                  name: pluralize(
                    'Banned User',
                    's',
                    bannedMembers.length + bannedIds.length
                  ),
                  value: `${bannedMembers
                    .map((m) => userToMentionAndTag(m.user))
                    .join('\n')}\n${bannedIds.map(idToUser).join('\n')}`.trim(),
                  inline: false,
                },
                { name: 'Reason', value: reason, inline: false },
              ],
            })
          );
        }
        break;
      case 'CANCEL':
        await message.channel.send(errorEmbed('Cancelled'));
        await editEmbed(banConfirmation, { footer: 'Cancelled' });
        break;
      case 'TIMEOUT':
        await message.channel.send(errorEmbed('Failed to confirm'));
        await editEmbed(banConfirmation, { footer: 'Timed out' });
        break;
    }
  },
};

async function banUsers({
  server,
  members,
  nonMemberIds,
  deleteDays,
  reason,
  auditLogReason,
}: {
  server: Server;
  members: GuildMember[];
  nonMemberIds?: string[];
  deleteDays: number;
  reason: string;
  auditLogReason: string;
}) {
  const failedBanIds: string[] = [];
  const dmFailedMembers: GuildMember[] = [];
  await Promise.all(
    members.map(async (mem) => {
      try {
        await mem.send(
          makeEmbed({
            title: `You have been banned from ${server.guild}`,
            description: `Reason: ${reason}`,
          })
        );
      } catch (e) {
        dmFailedMembers.push(mem);
      }
      try {
        await mem.ban({
          days: deleteDays,
          reason: auditLogReason,
        });
      } catch (e) {
        failedBanIds.push(mem.id);
      }
    })
  );
  if (nonMemberIds?.length) {
    await Promise.all(
      nonMemberIds.map(async (id) => {
        try {
          await server.guild.members.ban(id, {
            days: deleteDays,
            reason: auditLogReason,
          });
        } catch (e) {
          failedBanIds.push(id);
        }
      })
    );
  }
  return {
    failedBanIds,
    dmFailedMembers,
  };
}

export default command;
