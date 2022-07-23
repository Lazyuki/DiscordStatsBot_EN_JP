import { ActionRowBuilder, SelectMenuBuilder, GuildMember } from 'discord.js';

export function getUserDropdown(members: GuildMember[]) {
  const row = new ActionRowBuilder<SelectMenuBuilder>();
  const maxMembers = members.slice(0, 25);
  row.addComponents(
    new SelectMenuBuilder()
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
