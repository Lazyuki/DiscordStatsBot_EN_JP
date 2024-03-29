import { CommandArgumentError } from '@/errors';
import { BotCommand, GuildMessage } from '@/types';
import { waitForConfirmOrCancel } from '@utils/asyncCollector';
import { BLACK } from '@utils/constants';
import { DAY_IN_MILLIS, memberJoinAge } from '@utils/datetime';
import {
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { idToUser } from '@utils/guildUtils';
import { REGEX_RAW_ID } from '@utils/regex';
import { stripIndents } from 'common-tags';
import { GuildMember, SnowflakeUtil } from 'discord.js';

const command: BotCommand = {
  name: 'raidban',
  aliases: ['banraid'],
  isAllowed: ['BanMembers'],
  requiredBotPermissions: ['BanMembers'],
  description:
    'Ban all users joined after the provided user/Discord ID. If the first user has already left the server, use the ID of the message right before their join notification.',
  options: [
    {
      name: 'last',
      short: 'l',
      description: 'The last user in the suspected raid',
      bool: false,
    },
    {
      name: 'except',
      short: 'x',
      description: 'Innocent bystander.',
      bool: false,
    },
  ],
  arguments: '<user or message ID>',
  examples: [
    'raidban @user',
    'raidban 1234567890',
    [
      'raidban @firstUser --last @lastUser --except @innocent --except @innocent2',
      'This will ban @firstUser and anyone after that up to and including @lastUser, except @innocent and @innocent2',
    ],
  ],
  normalCommand: async ({ bot, content, server, message, options }) => {
    const deleteDays = 1;
    const [firstArg] = content.split(/\s+/);
    const firstId = firstArg.match(REGEX_RAW_ID)?.[0];
    if (!firstId) {
      throw new CommandArgumentError(
        'Please specify a user or provide a Discord ID'
      );
    }

    const firstMember = server.guild.members.cache.get(firstId);
    let firstMillis = 0;
    if (firstMember) {
      if (firstMember.joinedAt) {
        firstMillis = firstMember.joinedAt?.getTime();
      } else {
        firstMillis =
          server.temp.newUsers.find((n) => n.id === firstMember.id)
            ?.joinMillis || 0;
      }
    } else {
      // Maybe the first member alread left, see my new user cache
      const newUser = server.temp.newUsers.find((n) => n.id === firstId);
      if (newUser) {
        firstMillis = newUser.joinMillis;
      } else {
        firstMillis = SnowflakeUtil.timestampFrom(firstId);
      }
    }
    if (firstMillis === 0) {
      throw new CommandArgumentError('Unable to determine the raid begin time');
    }
    const nowMillis = new Date().getTime();
    if (nowMillis - firstMillis > DAY_IN_MILLIS) {
      throw new CommandArgumentError(
        'The first user join date cannot be older than 1 day'
      );
    }

    let endMillis = nowMillis;
    const last = options['last'] as string;
    if (last) {
      const lastId = last.match(REGEX_RAW_ID)?.[0];
      if (!lastId) {
        throw new CommandArgumentError(
          'Please specify a valid ID for the `--last` option'
        );
      }
      const lastMember = server.guild.members.cache.get(lastId);
      if (lastMember) {
        if (lastMember.joinedAt) {
          firstMillis = lastMember.joinedAt?.getTime();
        } else {
          firstMillis =
            server.temp.newUsers.find((n) => n.id === lastMember.id)
              ?.joinMillis || 0;
        }
      } else {
        // Maybe the first member alread left, see my new user cache
        const newUser = server.temp.newUsers.find((n) => n.id === lastId);
        if (newUser) {
          firstMillis = newUser.joinMillis;
        } else {
          firstMillis = SnowflakeUtil.timestampFrom(lastId);
        }
      }
      if (endMillis === nowMillis) {
        throw new CommandArgumentError('Unable to determine the end of raid');
      }
    }
    if (endMillis - firstMillis < 0) {
      throw new CommandArgumentError(
        'The last user cannot be before the first user'
      );
    }

    const exceptions = options['except'] as string;
    const exceptionIds: string[] = [];
    if (exceptions) {
      const exceptUsers = exceptions.split(',');
      exceptUsers.forEach((e) => {
        const id = e.match(REGEX_RAW_ID);
        if (id) exceptionIds.push(id[1]);
      });
    }

    const members: GuildMember[] = [];
    const nonMemberIds: string[] = [];
    server.guild.members.cache.forEach((mem, memID) => {
      if (!mem.joinedAt) return;
      const memMillis = mem.joinedAt.getTime();
      if (
        memMillis >= firstMillis &&
        memMillis <= endMillis &&
        !exceptionIds.includes(memID)
      ) {
        members.push(mem);
      }
    });
    server.temp.newUsers.forEach((nu) => {
      if (
        nu.joinMillis >= firstMillis &&
        nu.joinMillis <= endMillis &&
        !exceptionIds.includes(nu.id) &&
        !nonMemberIds.includes(nu.id)
      ) {
        if (!members.some((m) => m.id === nu.id)) {
          nonMemberIds.push(nu.id);
        }
      }
    });

    const confirmationMessage = await message.channel.send(
      makeEmbed({
        title:
          '<:hypergeralthinkban:443803651325034507> RAID BAN <:hypergeralthinkban:443803651325034507>',
        description: stripIndents`
        ${members
          .map(
            (member) =>
              `${member}: ${member.user.tag} ${memberJoinAge(member, 7)}`
          )
          .join('\n')}
        ${nonMemberIds.map(idToUser).join('\n')}

        Type \`confirm\` or \`cancel\` 
        `,
        color: BLACK,
      })
    );
    const auditLogReason = `By ${message.author.tag} (${message.author.id}) Reason: Raid ban.`;
    const confirm = await waitForConfirmOrCancel(
      confirmationMessage as GuildMessage,
      message.author.id,
      45,
      true
    );
    const failedBanIds: string[] = [];
    if (confirm) {
      let someBanned = false;
      await Promise.all(
        members.map(async (mem) => {
          try {
            await mem.ban({
              deleteMessageDays: deleteDays,
              reason: auditLogReason,
            });
            someBanned = true;
          } catch (e) {
            await message.channel.send(errorEmbed(`Failed to ban ${mem}`));
            failedBanIds.push(mem.id);
          }
        })
      );
      await Promise.all(
        nonMemberIds.map(async (id) => {
          try {
            await server.guild.members.ban(id, {
              deleteMessageDays: deleteDays,
              reason: auditLogReason,
            });
            someBanned = true;
          } catch (e) {
            await message.channel.send(
              errorEmbed(
                `Failed to ban the user with ID: ${id} (Possibly not a user)`
              )
            );
            failedBanIds.push(id);
          }
        })
      );
      if (someBanned) {
        await message.channel.send(
          successEmbed(
            `Banned ${
              members.length + nonMemberIds.length - failedBanIds.length
            } users`
          )
        );
      }
    } else {
      await message.channel.send(warningEmbed(`Raid ban cancelled`));
    }
  },
};

export default command;
