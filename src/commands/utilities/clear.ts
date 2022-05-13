import { BotCommand } from '@/types';
import { warningEmbed } from '@utils/embed';

import { CommandArgumentError, UserPermissionError } from '@/errors';
import { isMessageInChannels } from '@utils/guildUtils';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'clear',
  aliases: ['clr'],
  description:
    "Clear messages by Ciri. Defaults to 1 message. You can reply to Ciri's message to delete a specific message.",
  arguments: '[number of Ciri messages to delete]',
  examples: ['clr', 'clr 5'],
  normalCommand: async ({ message, content, server, bot }) => {
    const channel = message.channel;
    safeDelete(message);
    const messages = await channel.messages.fetch({ limit: 30 });
    const deleteCount = content ? parseInt(content, 10) : 1;
    if (isNaN(deleteCount)) {
      throw new CommandArgumentError(`Delete count must be a number`);
    }
    if (
      isMessageInChannels(message, [
        server.config.userLogChannel,
        server.config.modLogChannel,
      ])
    ) {
      throw new UserPermissionError(
        `You cannot clear my messages in this channel`
      );
    }

    if (message.reference) {
      await message.channel.delete(message.reference.messageId);
      return;
    }

    const messagesToDelete = [];
    for (const m of messages.values()) {
      if (m.author.id === bot.user?.id) {
        messagesToDelete.push(m);
      }
    }
    if (messagesToDelete.length === 0) {
      await message.channel.send(
        warningEmbed(`Couldn't find any messages by myself`)
      );
    }
    if (messagesToDelete.length === 1) {
      messagesToDelete[0].delete();
    } else {
      await message.channel.bulkDelete(messagesToDelete);
    }
  },
};

export default command;
