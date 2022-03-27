import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import {
  AJ,
  EJLX,
  EJLX_LANG_ROLE_IDS,
  EWBF,
  FE,
  FE2,
  FJ,
  HJ,
  NE,
  NJ,
  NU,
  OL,
} from '@utils/constants';
import { cleanEmbed, makeEmbed, warningEmbed } from '@utils/embed';
import { joinNaturally } from '@utils/formatString';
import { safeDelete } from '@utils/safeDelete';
import { GuildMember } from 'discord.js';

declare module '@/types' {
  interface ServerTemp {
    newUsers: string[];
  }
}

const LANG_ROLES = [
  { key: 'fe2', id: FE2 },
  { key: 'nj', id: NJ },
  { key: 'jp', id: NJ },
  { key: 'fj', id: FJ },
  { key: 'ne', id: NE },
  { key: 'en', id: NE },
  { key: 'fe', id: FE },
  { key: 'ol', id: OL },
  { key: 'hj', id: HJ },
  { key: 'aj', id: AJ },
  { key: 'nu', id: NU },
];

const TAG_ROLE_REGEX = new RegExp(
  `\\b(${LANG_ROLES.map((r) => r.key).join('|')})\\b`,
  'gi'
);
const ROLE_IDS = [...EJLX_LANG_ROLE_IDS, NU];

const command: BotCommand = {
  name: 'tag',
  aliases: ['t'],
  allowedServers: [EJLX],
  isAllowed: 'WP',
  description: `Assign language roles. You can reply to a message using this command and it will get the message author. Also see the pin in <#${EWBF}>`,
  options: [
    {
      name: 'newUser',
      short: 'n',
      description:
        'Go up the messages in the channel and select the most recent message from a new user',
      bool: true,
    },
  ],
  arguments:
    '< nj | fj | aj | hj | ne | fe | fe2 | ol | nu >... [ @mention, 1, 2, 3, id ] ',
  examples: ['tag nj fe @geralt', 'tag ne 2', 'tag ol -n'],
  onCommandInit: (server) => {
    server.temp.newUsers = [];
  },
  normalCommand: async ({ message, content, options, server }) => {
    const roleKeys = content.match(TAG_ROLE_REGEX);
    if (!roleKeys) {
      throw new CommandArgumentError('Please specify valid role abbreviations');
    }
    const roleIds = [
      ...new Set(
        LANG_ROLES.filter((r) => roleKeys.includes(r.key)).map((r) => r.id)
      ),
    ];
    const searchChannel = Boolean(options['newUser']);
    content = content.replace(TAG_ROLE_REGEX, '').trim();
    let member: GuildMember | undefined;
    if (message.reference?.messageId) {
      const reference = await message.channel.messages.fetch(
        message.reference.messageId
      );
      if (reference.member) {
        member = reference.member;
      } else {
        throw new CommandArgumentError('Please specify a user to tag');
      }
    } else if (searchChannel) {
      const recentMessages = await message.channel.messages.fetch({
        limit: 30,
      });
      for (const message of recentMessages.values()) {
        const author = message.member;
        if (author?.roles.cache.hasAny(...EJLX_LANG_ROLE_IDS)) continue;
        if (author) {
          member = author;
          break;
        }
      }
      if (!member) {
        throw new CommandArgumentError(
          `Could not find any new user in the last 30 messages`
        );
      }
    } else {
      const { members, nonMemberIds } = parseMembers(content, server.guild);
      if (members.length === 0 && nonMemberIds.length === 0) {
        // Using 1, 2, or 3?
        const newMemberIndex = content ? parseInt(content) : 1;
        if (isNaN(newMemberIndex) || newMemberIndex < 1 || newMemberIndex > 3) {
          throw new CommandArgumentError('Please specify a user to tag');
        } else {
          const userId = server.temp.newUsers[newMemberIndex - 1];
          member = server.guild.members.cache.get(userId);
          if (!member) {
            // New user already left
            await message.reply(
              warningEmbed(
                `The member you tried to tag has arleady left the server.`
              )
            );
            return;
          }
        }
      } else {
        if (members.length === 0) {
          throw new CommandArgumentError(
            `The user <@${nonMemberIds[0]}> has already left the server`
          );
        }
        member = members[0];
      }
    }
    if (!member) {
      await message.react('❓'); // Never reach here?
      return;
    }
    safeDelete(message);
    const oldRoles = [
      ...member.roles.cache.filter((r) => ROLE_IDS.includes(r.id)).values(),
    ];
    const oldRoleNames = joinNaturally(
      oldRoles.map((r) => `\`${r.name.split('/')[0]}\``)
    );
    const removeRoles = oldRoles.filter((r) => !roleIds.includes(r.id));
    const addRoleIds = roleIds.filter(
      (id) => !oldRoles.some((r) => r.id === id)
    );
    if (removeRoles.length === 0 && addRoleIds.length === 0) {
      const alreadyTagged = await message.channel.send(
        cleanEmbed(`Already tagged as ${oldRoleNames}`)
      );
      setTimeout(() => alreadyTagged.delete(), 5000);
      return;
    }
    const reason = `Issued by: ${message.author.tag} (${message.author.id})`;
    await member.roles.remove(removeRoles, reason);
    await member.roles.add(addRoleIds, reason);
    member = server.guild.members.cache.get(member.id)!;

    const memberColor = member.displayHexColor;
    const sortedNewRoles = ROLE_IDS.filter((id) => roleIds.includes(id)).map(
      (id) => `<@&${id}>`
    );
    let description = '';
    if (
      removeRoles.length === 0 ||
      (removeRoles.length === 1 && removeRoles[0].id === NU)
    ) {
      description = `**${
        member.user.username
      }**, you've been tagged as ${joinNaturally(sortedNewRoles)} by ${
        message.author.username
      }!`;
    } else {
      description = `**${
        member.user.username
      }**, you've been tagged as ${joinNaturally(
        sortedNewRoles
      )} instead of ${oldRoleNames} by ${message.author.username}!`;
    }
    await message.channel.send(
      makeEmbed({
        color: memberColor,
        description,
        footer: `${member.user.tag} (${member.user.id})`,
      })
    );
  },
};

export default command;
