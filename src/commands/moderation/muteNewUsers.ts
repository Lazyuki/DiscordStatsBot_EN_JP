import { BotCommand } from '@/types';
import { successEmbed } from '@utils/embed';
import { PermissionString } from 'discord.js';
import { EJLX, NU } from '@utils/constants';

const MUTED_PERMS: PermissionString[] = [
  'VIEW_CHANNEL',
  'READ_MESSAGE_HISTORY',
];
const MINIMAL_PERMS: PermissionString[] = [
  'VIEW_CHANNEL',
  'SEND_MESSAGES',
  'READ_MESSAGE_HISTORY',
  'ADD_REACTIONS',
  'CHANGE_NICKNAME',
];

const command: BotCommand = {
  name: 'muteNewUsers',
  aliases: ['mnu'],
  allowedServers: [EJLX],
  requiredBotPermissions: ['MANAGE_ROLES'],
  isAllowed: ['ADMIN'],
  description:
    'Mute new users in text chat. Invoke the command again to disable it. **Intended for raids**. Use `lockdown` if the raid is severe.',
  examples: ['mnu'],
  normalCommand: async ({ message, server }) => {
    const newUser = server.guild.roles.cache.get(NU);
    if (!newUser) return;
    if (newUser.permissions.has('SEND_MESSAGES')) {
      // Get rid of all permissions.
      await newUser.setPermissions(MUTED_PERMS);
      await server.guild.roles.everyone.setPermissions(MUTED_PERMS);
      await message.channel.send(
        successEmbed(
          'New Users are now *muted*. YOU MUST type the same command again once the raid is over.'
        )
      );
    } else {
      // restore the old state
      await newUser.setPermissions(MINIMAL_PERMS);
      await server.guild.roles.everyone.setPermissions(MINIMAL_PERMS);
      await message.channel.send(
        successEmbed(
          'New Users are now *muted*. YOU MUST type the same command again once the raid is over.'
        )
      );
    }
  },
};

export default command;
