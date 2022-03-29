import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { getTextChannel } from '@utils/guildUtils';
import { optionParser } from '@utils/optionParser';

const command: BotCommand = {
  name: 'pipe',
  description:
    'Reply to a message and pipe the content into another command. The content will be *prepended* to the other command unless you use the `-a` option',
  options: [
    {
      name: 'append',
      short: 'a',
      description:
        'Append the content of the original message instead of prepending it',
      bool: true,
    },
  ],
  examples: ['pipe u` While replying to a message', 'pipe id'],
  normalCommand: async ({
    bot,
    message,
    content,
    server,
    options,
    ...rest
  }) => {
    if (message.reference) {
      // Message reply
      const channel = getTextChannel(server.guild, message.reference.channelId);
      if (!channel || !message.reference.messageId) {
        throw new CommandArgumentError('Impossible message reference');
      }
      const sourceMessage = await channel.messages.fetch(
        message.reference.messageId
      );
      let sourceContent = sourceMessage.content;
      if (sourceContent.startsWith(server.config.prefix)) {
        sourceContent = sourceContent.split(' ').slice(1).join(' ');
      }
      const pipeCommand = bot.commands[content.split(' ')[0]];
      if (pipeCommand) {
        if (pipeCommand.name === 'pipe') {
          throw new CommandArgumentError('No');
        }
        content = content.split(' ').slice(1).join(' ');
        const isAllowed = pipeCommand.isAllowed(message, server, bot);
        if (isAllowed && pipeCommand.normalCommand) {
          if (pipeCommand.options) {
            const { restContent, resolvedOptions } = optionParser(
              sourceContent,
              pipeCommand.options
            );
            sourceContent = restContent.trim();
            options = { ...options, ...resolvedOptions };
          }
          if (options['append']) {
            content += ' ' + sourceContent;
          } else {
            content = sourceContent + ' ' + content;
          }
          await pipeCommand.normalCommand({
            bot,
            message,
            content,
            server,
            options,
            ...rest,
          });
        } else {
          // Don't even error out
          return;
        }
      }
    } else {
      throw new CommandArgumentError('Reply to a message to pipe the content');
    }
  },
};

export default command;
