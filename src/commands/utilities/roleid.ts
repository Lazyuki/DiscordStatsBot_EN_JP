import { BotCommand } from '@/types';
import { CommandArgumentError } from '@/errors';
import { errorEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'roleId',
  description: 'Get the role ID',
  arguments: '<role name (could be partial)>',
  examples: ['roleid native japanese'],
  normalCommand: async ({ content, message, server }) => {
    const roleName = content.toLowerCase().replace('@', '');
    if (!roleName) {
      throw new CommandArgumentError('Please specify a role');
    }
    let roles = '';
    for (const role of server.guild.roles.cache.values()) {
      if (role.name.toLowerCase().includes(roleName)) {
        roles += `**${role.name}**: ${role.id}\n`;
      }
    }
    if (roles) {
      await message.channel.send(roles);
    } else {
      await message.channel.send(
        errorEmbed(`\`${content}\` did not match any role in this server`)
      );
    }
  },
};

export default command;
