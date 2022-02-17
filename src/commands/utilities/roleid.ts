import { BotCommand } from '@/types';
import { CommandArgumentError } from '@/errors';

const command: BotCommand = {
  description: 'Get the role ID',
  arguments: '<role name (could be partial)>',
  examples: ['{PF}roleid native japanese'],
  normalCommand: async ({ commandContent, message, server }) => {
    const roleName = commandContent.toLowerCase().replace('@', '');
    if (!roleName) {
      throw new CommandArgumentError('Please enter a role');
    }
    let roles = '';
    for (const role of server.guild.roles.cache.values()) {
      if (role.name.toLowerCase().includes(roleName)) {
        roles += `${role.name}: ${role.id}\n`;
      }
    }
    await message.channel.send(roles);
  },
};

export default command;
