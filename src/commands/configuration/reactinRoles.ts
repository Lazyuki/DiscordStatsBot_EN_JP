import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseSubCommand } from '@utils/argumentParsers';
import { successEmbed } from '@utils/embed';
import { getTextChannel } from '@utils/guildUtils';
import {
  REGEX_MESSAGE_LINK,
  REGEX_MESSAGE_LINK_OR_FULL_ID,
} from '@utils/regex';

declare module '@/types' {
  interface ServerData {
    selfRoles: Record<string, string>;
    selfRoleMessageId?: string;
  }
}

const sar: BotCommand = {
  name: 'reactinRoles',
  aliases: ['sar'],
  isAllowed: ['ADMIN'],
  description: 'Configure reaction based self assignable roles (sar). ',
  arguments:
    '[add | remove | list | link | update ] [emoji] [@role/role ID] [message link]',
  examples: [
    'sar list',
    'sar add 📝 1234567891234567890',
    'sar add <:customEmoji:1234567891234567890> @SomeRole',
    'sar remove <:customEmoji:1234567891234567890>',
    'sar remove 📝',
    'sar link https://discord.com/channels/123456789123456789/123456789123456789/123456789123456789',
    [
      'sar update',
      'Once the message has been linked, this command will make Ciri add the reactions. When you add/remove reaction roles, run this command again to update the reactions on the message',
    ],
  ],
  onCommandInit: (server) => {
    server.data.selfRoles ||= {};
  },
  normalCommand: async ({ content, message, server, options }) => {
    const { subCommand, restContent } = content
      ? parseSubCommand(content, ['add', 'remove', 'list', 'link', 'update'])
      : { subCommand: 'list', restContent: '' };

    const currentSelfRoles = server.data.selfRoles;

    switch (subCommand) {
      case 'list': {
        return;
      }
      case 'add': {
        return;
      }
      case 'remove': {
        return;
      }
      case 'link': {
        const linkMatch = restContent.match(REGEX_MESSAGE_LINK_OR_FULL_ID);
        if (!linkMatch) {
          throw new CommandArgumentError(`Please provide a valid message link`);
        }
        const [_, channelId, messageId] = linkMatch;
        const reactionChannel = getTextChannel(server.guild, channelId);
        if (!reactionChannel)
          throw new CommandArgumentError(`Invalid Channel ID ${channelId}`);
        const reactionMessage = await reactionChannel.messages.fetch(messageId);
        if (!reactionMessage)
          throw new CommandArgumentError(`Invalid Message ID ${messageId}`);
        server.data.selfRoleMessageId = `${channelId}-${messageId}`;
        await message.channel.send(
          successEmbed(
            `Message linked. Run \`${server.config.prefix}sar update\` to add reactions to the message.`
          )
        );
        server.save();
        return;
      }
      case 'update': {
        if (!server.data.selfRoleMessageId) {
          throw new CommandArgumentError(
            `You have to set the reaction role message first with \`${server.config.prefix}sar link MESSAGE_LINK\` where the MESSAGE_LINK is the link to the static message`
          );
        }
      }
    }
  },
};

export default sar;
