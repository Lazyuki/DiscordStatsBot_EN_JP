import { BotCommand, ServerTemp } from '@/types';
import { EJLX } from '@utils/constants';
import { successEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';
import {
  Collection,
  GuildMember,
  PartialGuildMember,
  VoiceBasedChannel,
} from 'discord.js';

declare module '@/types' {
  interface ServerTemp {
    newUsers: string[];
  }
}

const command: BotCommand = {
  name: 'tag',
  allowedServers: [EJLX],
  isAllowed: 'WP',
  description: 'Assign language roles to new users',
  onCommandInit: (server) => {
    server.temp.newUsers = [];
  },
  normalCommand: async ({ message, bot }) => {
    safeDelete(message);
    await message.channel.send(
      successEmbed({
        description: `has been tagged as by`,
      })
    );
  },
};

export default command;
