import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseChannels, parseMessageId } from '@utils/argumentParsers';

const send: BotCommand = {
  name: 'send',
  isAllowed: ['SERVER_MODERATOR'],
  description: 'Send a message in a channel.',
  arguments: '< #channel > < message content >',
  examples: ['send #channel hello I have become sentient'],
  childCommands: ['edit'],
  normalCommand: async ({ message, content, server }) => {
    const { textChannels, restContent } = parseChannels(content, server.guild);
    if (textChannels.length === 0) {
      throw new CommandArgumentError('Please select a channel');
    }
    if (!restContent) {
      throw new CommandArgumentError('Message content cannot be empty');
    }
    await textChannels[0].send(restContent);
    await message.react('✅');
  },
};

const edit: BotCommand = {
  name: 'send',
  isAllowed: ['SERVER_MODERATOR'],
  description: 'Send a message in a channel.',
  arguments: '< full message ID > < new message content>',
  examples: [
    'edit 12345678901234567890-12345678901234567890 oops I meant I have become lenient',
  ],
  parentCommand: 'send',
  normalCommand: async ({ message, content, bot, server }) => {
    const messageId = content.split(' ')[0];
    const originalMessage = await parseMessageId(messageId, server.guild);
    if (originalMessage.author.id !== bot.user?.id) {
      throw new CommandArgumentError('The message is not mine');
    }
    if (originalMessage.embeds.length) {
      throw new CommandArgumentError('I cannot edit that message');
    }
    const newContent = content.replace(messageId, '').trim();
    await originalMessage.edit(newContent);
    await message.react('✅');
  },
};

export default [send, edit];
