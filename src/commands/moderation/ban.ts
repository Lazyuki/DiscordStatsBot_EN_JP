import { BotCommand, GuildMessage } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import {
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { waitForYesOrNo } from '@utils/asyncMessageCollector';
import { Message } from 'discord.js';
import { AGT, BLACK, EJLX } from '@utils/constants';
import { stripIndent } from 'common-tags';
import { memberJoinAge } from '@utils/datetime';
import { pluralize } from '@utils/pluralize';
import { getTextChannel, idToUser } from '@utils/guildUtils';

const command: BotCommand = {
  name: 'ban',
  isAllowed: 'BAN_MEMBERS',
  requiredBotPermissions: ['BAN_MEMBERS'],
  description:
    'Ban! You can specify multiple users. Or use `raidban` for banning the entire raid party. ',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'ban @user being too good at Japanese',
    'ban 284840842026549259 299335689558949888 no reason just cause',
  ],
  options: [
    {
      name: 'days',
      short: 'd',
      bool: false,
      description: 'Number of days to delete. Default to 1',
    },
  ],
  normalCommand: async ({ content, bot, message, server, options }) => {
    const executor = message.author;
    let deleteDays = options
      ? typeof options['days'] === 'string'
        ? parseInt(options['days'])
        : 1
      : 1;
    let reason = 'Unspecified';
    const { members, nonMemberIds, allIds, restContent } = parseMembers(
      content,
      server.guild
    );
    if (message.reference?.messageId) {
      const reference = await message.channel.messages.fetch(
        message.reference.messageId
      );
      reference.member && members.push(reference.member);
    }
    if (restContent) reason = restContent;

    const unbannables = members.filter((mem) => !mem.bannable);
    if (unbannables.length) {
      await message.channel.send(`${unbannables.join(', ')} cannot be banned`);
      return;
    }

    let auditLogReason = `By ${executor.username} ${
      executor.id
    } Reason: ${reason.replace('\n', ' ')}`;
    if (auditLogReason.length > 512) {
      await message.channel.send(
        warningEmbed(
          `The ban reason exceeds the limit of 512 characters: \`${auditLogReason.length}\` characters.\n\nDo you want to send the full reason to the person and let Discord's audit log ban reason be truncated?`
        )
      );
      const sendAnyway = await waitForYesOrNo(message);
      if (!sendAnyway) return;
      auditLogReason = auditLogReason.slice(0, 512);
    }
    const failedBans: string[] = [];

    const deleting = deleteDays
      ? `__Deleting__: Messages from the past ${deleteDays} ${pluralize(
          'day',
          's',
          deleteDays
        )}\n(type \`confirm keep\` to not delete messages)`
      : `**NOT DELETING** any messages`;

    await message.channel.send(
      makeEmbed({
        title:
          '<:hypergeralthinkban:443803651325034507> BAN <:hypergeralthinkban:443803651325034507>',
        description: stripIndent`
        ${members
          .map(
            (member) =>
              `${member}: ${member.user.tag} ${memberJoinAge(member, 7)}`
          )
          .join('\n')}
        ${allIds.map(idToUser).join('\n')}

        __Reason__: ${reason}

        ${deleting}

        Type ${
          deleteDays !== 0 ? '`confirm delete`, ' : ''
        }\`confirm keep\` or \`cancel\` 
        `,
        color: BLACK,
      })
    );
    const filter = (m: Message) => m.member?.id == executor.id;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 45000,
    });
    collector.on('collect', async (m) => {
      const resp = m.content.toLowerCase();
      if (
        [
          'confirm d',
          'confirm del',
          'confirm delete',
          'confirm k',
          'confirm keep',
        ].includes(resp)
      ) {
        if (resp.startsWith('confirm k')) {
          deleteDays = 0;
        }
        let someBanned = false;
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
              await message.channel.send(
                errorEmbed(`Failed to DM the ban reason to ${mem}`)
              );
            }
            try {
              await mem.ban({
                days: deleteDays,
                reason: auditLogReason,
              });
              someBanned = true;
            } catch (e) {
              await message.channel.send(errorEmbed(`Failed to ban ${mem}`));
              failedBans.push(mem.id);
            }
          })
        );
        await Promise.all(
          nonMemberIds.map(async (id) => {
            try {
              await server.guild.members.ban(id, {
                days: deleteDays,
                reason: auditLogReason,
              });
              someBanned = true;
            } catch (e) {
              await message.channel.send(
                errorEmbed(
                  `Failed to ban the user with ID: ${id} (Possibly not a user)`
                )
              );
              failedBans.push(id);
            }
          })
        );
        if (someBanned) {
          collector.stop('Banned');
        } else {
          collector.stop('Failed');
        }
        return;
      }
      if (resp == 'cancel') {
        collector.stop('Cancelled');
        return;
      }
      await message.channel.send(
        errorEmbed(
          'Invalid response. Type `confirm delete`, `confirm keep` or `cancel`'
        )
      );
    });
    collector.on('end', async (collected, endReason) => {
      if (endReason === 'Banned') {
        const bannedMembers = members.filter((m) => !failedBans.includes(m.id));
        const bannedIds = nonMemberIds.filter((id) => !failedBans.includes(id));
        await message.channel.send(
          successEmbed(`Banned ${allIds.length - failedBans.length} users`)
        );
        if (server.guild.id === EJLX) {
          const agt = getTextChannel(server.guild, AGT);
          await agt?.send(
            makeEmbed({
              authorName: message.author.tag,
              title: 'Ban',
              color: BLACK,
              footer: `In #${message.channel.name}`,
              fields: [
                {
                  name: 'Banned Users',
                  value: `${bannedMembers
                    .map((m) => `${m}: ${m.user.tag}`)
                    .join('\n')}\n${bannedIds.map(idToUser).join('\n')}`.trim(),
                  inline: false,
                },
                { name: 'Reason', value: reason, inline: false },
              ],
            })
          );
        }
      } else if (endReason == 'Cancelled') {
        await message.channel.send(errorEmbed('Cancelled'));
      } else if (endReason == 'Failed') {
        await message.channel.send(
          errorEmbed(
            "Unable to ban them. Make sure the number of days is set appropriately and the ban message isn't too long"
          )
        );
      } else {
        await message.channel.send(errorEmbed('Failed to confirm'));
      }
    });
  },
};

export default command;
