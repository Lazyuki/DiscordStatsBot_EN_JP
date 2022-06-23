import { CommandArgumentError } from '@/errors';
import { BotCommand, GuildMessage } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import {
  cleanEmbed,
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { joinNaturally } from '@utils/formatString';
import { GuildMember, Message } from 'discord.js';
import { getFallbackChannel } from '@utils/asyncCollector';
import { deleteAfter, safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'archive',
  aliases: ['a'],
  isAllowed: ['SERVER_MODERATOR'],
  description: 'Archive a thread, since you CANNOT do that on mobile!???',
  arguments: '[ thread ID ]',
  examples: ['a', 'a 12345678901234567890'],
  normalCommand: async ({ message, content, server }) => {
    const id = content || message.channel.id;
    const thread = server.guild.channels.cache.get(id);
    if (thread && thread.isThread()) {
      thread.setArchived(true, `Issued by: ${message.author.tag}`);
      safeDelete(message);
      const success = await message.channel.send(successEmbed('Archived'));
      deleteAfter(success);
    } else {
      await message.channel.send(
        errorEmbed(
          'Please specify a valid thread ID to archive, or type this command in the thread'
        )
      );
    }
  },
};

export default command;
