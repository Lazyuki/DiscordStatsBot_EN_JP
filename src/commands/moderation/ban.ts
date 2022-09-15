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
import { GuildMember, User } from 'discord.js';
import { BLACK, EJLX } from '@utils/constants';
import { stripIndents } from 'common-tags';
import { memberJoinAge } from '@utils/datetime';
import { pluralCount, pluralize } from '@utils/pluralize';
import { getTextChannel, idToUser } from '@utils/guildUtils';
import {
  channelName,
  code,
  joinNaturally,
  userToMentionAndTag,
} from '@utils/formatString';
import Server from '@classes/Server';
import { getBanConfirmationButtons } from '@utils/buttons';
import { BotError, CommandArgumentError } from '@/errors';

const APPEAL_INVITE_PATH = 'pnHEGPah8X';

const command: BotCommand = {
  name: 'ban',
  isAllowed: ['BanMembers', 'MAINICHI_COMMITTEE'],
  requiredBotPermissions: ['BanMembers'],
  description:
    'Ban! You can specify multiple users. Or use `raidban` for banning the entire raid party.',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'ban @user being too good at Japanese -a',
    'ban 284840842026549259 299335689558949888 -d 0',
    'ban @user -s banned you but we are not sending you this reason',
    'ban @user -m This is an important message and @user will not be banned if they have their DMs closed.',
  ],
  options: [
    {
      name: 'appeal',
      short: 'a',
      bool: true,
      description: 'Include the EJLX ban appeal server link in the ban message',
    },
    {
      name: 'days',
      short: 'd',
      bool: false,
      description: 'Number of days to delete. Default to 1',
    },
    {
      name: 'silent',
      short: 's',
      bool: true,
      description:
        "Don't try to send the ban reason to the users. Non-server members (people who have left already) won't receive the DM by default.",
    },
    {
      name: 'messageEnforced',
      short: 'm',
      bool: true,
      description:
        'Abort banning users who have their DMs closed. You will need to find a way to send the message somehow.',
    },
  ],
  childCommands: ['unban'],
  normalCommand: async ({ content, message, server, options, bot }) => {
    const executor = message.author;
    const allowAppeal = Boolean(options['appeal']) && server.guild.id === EJLX;
    const silent = Boolean(options['silent']);
    const forceMessage = Boolean(options['messageEnforced']);

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

    await message.channel.sendTyping();

    const outsideUsers: User[] = [];
    for (const nonMemberId of nonMemberIds) {
      try {
        const user = await bot.users.fetch(nonMemberId);
        outsideUsers.push(user);
      } catch (e) {
        await message.channel.send(
          errorEmbed(`The ID ${code(nonMemberId)} is not a valid Discord user.`)
        );
        return;
      }
    }

    let auditLogReason = `By ${executor.tag} (${
      executor.id
    }) Reason: ${reason.replace('\n', ' ')}`;
    if (auditLogReason.length > 512) {
      const questionMessage = await message.channel.send(
        warningEmbed(
          `The ban reason exceeds the limit of 512 characters at \`${auditLogReason.length}\` characters.\n\nDo you want me to send the full reason to the person and let Discord's audit log ban reason be truncated?`
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
          .join('\n')}${outsideUsers.length ? '\n' : ''}${outsideUsers
          .map(userToMentionAndTag)
          .join('\n')}

        __Reason__: ${reason}
        ${allowAppeal ? '\n__**BAN APPEAL**__ link included\n' : ''}
        ${silent ? '\n__**NOT SENDING DMs**__\n' : ''}
        ${forceMessage ? '\n__**ABORTING** if DMs closed__\n' : ''}
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
          outsideUsers,
          deleteDays,
          reason,
          auditLogReason,
          allowAppeal,
          silent,
          forceMessage,
        });
        const { failedBanIds, dmFailedMembers } = banResult;

        const bannedMembers = members.filter(
          (m) => !failedBanIds.includes(m.id)
        );
        const bannedUsers = outsideUsers.filter(
          (user) => !failedBanIds.includes(user.id)
        );

        const dmFailString = dmFailedMembers.length
          ? `\n\nBut **failed** to DM: ${dmFailedMembers
              .map((mem) => userToMentionAndTag(mem.user))
              .join('\n')}`
          : ' and DMed the reason';

        const bannedUserCount = bannedMembers.length + bannedUsers.length;

        if (failedBanIds.length > 0) {
          const failedMembers = members
            .filter((m) => failedBanIds.includes(m.id))
            .map((m) => userToMentionAndTag(m.user));
          const failedUsers = outsideUsers
            .filter((u) => failedBanIds.includes(u.id))
            .map(userToMentionAndTag);
          await message.channel.send(
            errorEmbed(
              `Failed to ban:\n\n${failedMembers.join(
                '\n'
              )}\n${failedUsers.join('\n')}\n${
                forceMessage
                  ? 'since they had their DMs disabled'
                  : 'due to unknown errors'
              }.`
            )
          );
        }
        if (bannedUserCount === 0) {
          await editEmbed(banConfirmation, {
            footer: `Ban failed`,
          });
          return;
        } else {
          await message.channel.send(
            successEmbed(
              `Banned ${pluralCount(
                'user',
                's',
                bannedUserCount
              )}${dmFailString}`
            )
          );
        }
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
              footer: `By ${message.author.tag} in ${channelName(
                message.channel
              )}`,
              footerIcon: message.member.displayAvatarURL(),
              fields: [
                {
                  name: pluralize('Banned User', 's', bannedUserCount),
                  value: `${bannedMembers
                    .map((m) => userToMentionAndTag(m.user))
                    .join('\n')}\n${bannedUsers
                    .map(userToMentionAndTag)
                    .join('\n')}`.trim(),
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
  outsideUsers,
  deleteDays,
  reason,
  auditLogReason,
  allowAppeal,
  silent,
  forceMessage,
}: {
  server: Server;
  members: GuildMember[];
  outsideUsers: User[];
  deleteDays: number;
  reason: string;
  auditLogReason: string;
  allowAppeal: boolean;
  silent: boolean;
  forceMessage: boolean;
}) {
  const failedBanIds: string[] = [];
  const dmFailedMembers: GuildMember[] = [];
  await Promise.all(
    members.map(async (mem) => {
      if (!silent) {
        try {
          await mem.send(
            makeEmbed({
              title: `You have been banned from ${server.guild}`,
              description: `Reason: ${reason}`,
            })
          );
          if (allowAppeal) {
            await mem.send(
              `If you wish to appeal your ban at EJLX, join this server.\nサーバーBANに不服がある場合は以下のサーバーより申請してください。\nhttps://discord.gg/${APPEAL_INVITE_PATH}`
            );
          }
        } catch (e) {
          if (forceMessage) {
            failedBanIds.push(mem.id);
            return;
          } else {
            dmFailedMembers.push(mem);
          }
        }
      }
      try {
        await mem.ban({
          deleteMessageDays: deleteDays,
          reason: auditLogReason,
        });
      } catch (e) {
        failedBanIds.push(mem.id);
      }
    })
  );
  if (outsideUsers.length) {
    await Promise.all(
      outsideUsers.map(async (user) => {
        try {
          await server.guild.members.ban(user.id, {
            deleteMessageDays: deleteDays,
            reason: auditLogReason,
          });
        } catch (e) {
          failedBanIds.push(user.id);
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
