import { SimpleButton } from '@/types';
import {
  Message,
  MessageActionRow,
  MessageSelectMenu,
  MessageOptions,
  GuildMember,
  User,
} from 'discord.js';

export function getUserDropdown(members: GuildMember[]) {
  const row = new MessageActionRow();
  const maxMembers = members.slice(0, 25);
  row.addComponents(
    new MessageSelectMenu()
      .setPlaceholder('Select a user')
      .setCustomId('USERS')
      .setOptions(
        maxMembers.map((member) => {
          return {
            label: member.user.tag,
            value: member.id,
            description: `${member.displayName} (${member.id})`,
          };
        })
      )
  );
  return [row];
}
