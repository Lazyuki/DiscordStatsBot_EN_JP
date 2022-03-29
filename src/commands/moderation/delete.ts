import { CommandArgumentError } from '@/errors';
import { BotCommand, GuildMessage } from '@/types';
import Server from '@classes/Server';
import { parseSnowflakeIds } from '@utils/argumentParsers';
import { getExactDaysAgo } from '@utils/datetime';
import {
  errorEmbed,
  makeEmbed,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import { getTextChannel, idToChannel } from '@utils/guildUtils';
import { proxyPostAttachments } from '@utils/images';
import { pluralCount, pluralize } from '@utils/pluralize';
import {
  REGEX_MESSAGE_LINK_OR_FULL_ID,
  REGEX_RAW_ID,
  REGEX_URL,
  REGEX_USER,
} from '@utils/regex';
import { deleteAfter, safeDelete } from '@utils/safeDelete';
import { stripIndent } from 'common-tags';
import { Message, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';

async function proxyPost(message: Message, server: Server) {
  const channel = getTextChannel(
    server.guild,
    server.config.modActionLogChannel
  );
  if (!channel) return 0;
  return await proxyPostAttachments(message, channel);
}

async function notifyDeletes(
  messages: Message[],
  messagedWithImages: Record<string, number>,
  server: Server,
  commandMessage: GuildMessage
) {
  const channel = getTextChannel(
    server.guild,
    server.config.modActionLogChannel
  );
  if (!channel) return;
  const fields = messages.map((message) => {
    const hadFiles = messagedWithImages[message.id] || 0;
    let placeholder = hadFiles
      ? pluralize('See File', 's', hadFiles)
      : '*Empty*';
    return {
      name: `👤 ${message.author.tag} (${message.author.id}) in #${
        (message.channel as TextChannel).name
      }${hadFiles ? ` with ${pluralCount('file', 's', hadFiles)}` : ''}`,
      value: message.content || placeholder,
      inline: false,
    };
  });
  await channel.send(
    makeEmbed({
      color: 'RED',
      title: `Message Delete`,
      fields,
      footer: `By ${commandMessage.author.tag} in #${commandMessage.channel.name}`,
      footerIcon: commandMessage.member.displayAvatarURL(),
      timestamp: true,
    })
  );
}

const command: BotCommand = {
  name: 'delete',
  aliases: ['del'],
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  options: [
    {
      name: 'noLog',
      short: 'n',
      description: 'Admins can use this option to skip the mod action logging',
      bool: true,
    },
  ],
  requiredBotPermissions: ['MANAGE_MESSAGES'],
  description: stripIndent`
    Delete messages either by specifying the message IDs or by searching.
    When using message IDs, it will only fetch the messages in the channel the command is invoked in.
    To delete messages in other channels, copy the full ID by holding the SHIFT key when copying IDs, or use the message links.`,
  arguments:
    '[message IDs ...] [#channel] [@users] [number of messages to delete (max=25)] [has:link|image|"word"]',
  examples: [
    'del 123456789123456789',
    'del #general 123456789123456789 542576315115634688',
    'del 12345689123456789-542576315115634688',
    'del https://discord.com/channels/12345689123456789/12345689123456789/542576315115634688',
    'del 2',
    'del @geralt 3',
    'del 3 has:image',
    'del @geralt has:"ciri sucks"',
  ],
  normalCommand: async ({ content, message, server, options }) => {
    const guild = server.guild;
    const deletingMessages: Message[] = [];

    if (message.reference) {
      // Message reply
      const channel = getTextChannel(guild, message.reference.channelId);
      if (!channel || !message.reference.messageId) {
        throw new CommandArgumentError('Impossible message reference');
      }
      const delMessage = await channel.messages.fetch(
        message.reference.messageId
      );
      delMessage && deletingMessages.push(delMessage);
    } else {
      // Search messages
      const defaultChannel = message.mentions.channels.size
        ? getTextChannel(guild, message.mentions.channels.firstKey())
        : message.channel;
      if (!defaultChannel?.isText()) {
        throw new CommandArgumentError('Please specify a text channel');
      } else if (message.mentions.channels.size > 1) {
        throw new CommandArgumentError(
          'You can only specify 1 base channel. To delete messages from multiple channels, use links or the `channelId-messageId` syntax which can be obtained by holding the SHIFT key when copying the message IDs'
        );
      }
      content = content.replace(idToChannel(defaultChannel.id), '');
      const words = content.split(/\s+/);
      const fullMessageIds = words
        .map((word) => word.match(REGEX_MESSAGE_LINK_OR_FULL_ID))
        .filter(Boolean);

      if (fullMessageIds.length > 0) {
        for (const fullIdMatch of fullMessageIds) {
          const [_, channelId, messageId] = fullIdMatch!;
          const channel = getTextChannel(guild, channelId);
          const delMessage = await channel?.messages.fetch(messageId);
          delMessage && deletingMessages.push(delMessage);
        }
        content = content
          .replace(REGEX_MESSAGE_LINK_OR_FULL_ID, '')
          .replace(REGEX_URL, '')
          .trim();
      }

      const hasLink = /has:link/.test(content);
      const hasFile = /has:(image|file)/.test(content);
      const hasWord = content.match(/has:"(.+)"/)?.[1];
      content = content.replace(/has:(link|file|image|".+")/g, '').trim();

      const userMentions = content.match(REGEX_USER);
      let userIds: string[] = [];
      if (userMentions) {
        userIds = userMentions
          .map((mention) => mention.match(REGEX_RAW_ID)?.[0])
          .filter(Boolean) as string[];
        content = content.replace(REGEX_USER, '').trim();
      }

      // Rest of IDs are definitely message IDs
      const { ids: messageIds, rest } = parseSnowflakeIds(content, true);
      if (messageIds.length > 0) {
        for (const messageId of messageIds) {
          const delMessage = await defaultChannel.messages.fetch(messageId);
          delMessage && deletingMessages.push(delMessage);
        }
      }
      content = rest.trim();

      const numMessages = content ? parseInt(content) : 1;
      if (isNaN(numMessages)) {
        throw new CommandArgumentError(`Unknown argument: ${content}`);
      } else if (numMessages + deletingMessages.length > 25) {
        throw new CommandArgumentError(`You can only delete up to 25 messages`);
      }

      if (hasLink || hasFile || hasWord || userIds.length || numMessages > 1) {
        // Search messages to delete
        let remainingLoop = 5;
        let remainingDelete = numMessages;
        let before = message.id;
        await message.channel.sendTyping();
        while (remainingLoop > 0 && remainingDelete > 0) {
          remainingLoop--;
          const msgs = await defaultChannel.messages.fetch({
            limit: 100,
            before,
          });
          for (const msg of msgs.values()) {
            before = msg.id;
            if (userIds.length && !userIds.includes(msg.author.id)) continue;
            if (hasLink && !REGEX_URL.test(msg.content)) continue;
            if (hasFile && msg.attachments.size === 0) continue;
            if (hasWord && !msg.content.includes(hasWord)) continue;
            deletingMessages.push(msg);
            remainingDelete--;
            if (remainingDelete === 0) break;
          }
        }
        if (remainingDelete > 0) {
          await message.channel.send(
            warningEmbed(
              `Could not delete ${remainingDelete} messages since the last 500 messages didn't meet the conditions`
            )
          );
        }
      }
    }
    const notLogging =
      options['noLogs'] && message.member.permissions.has('ADMINISTRATOR');
    const messagedWithImages: Record<string, number> = {};

    if (deletingMessages.length === 0) {
      await message.channel.send(errorEmbed('No messages to delete'));
      return;
    } else if (deletingMessages.length === 1) {
      const delMessage = deletingMessages[0];
      if (delMessage.attachments.size && !notLogging) {
        await message.channel.sendTyping();
        messagedWithImages[delMessage.id] = await proxyPost(delMessage, server);
      }
      await delMessage.delete();
    } else {
      const channelToMessages: Record<
        string,
        {
          channel: TextChannel | ThreadChannel | NewsChannel;
          messageIds: string[];
        }
      > = {};
      const twoWeeksAgo = getExactDaysAgo(14).getTime(); // Discord can't bulk delete messages older than two weeks
      for (const delMessage of deletingMessages) {
        if (delMessage.attachments.size && !notLogging) {
          await message.channel.sendTyping();
          messagedWithImages[delMessage.id] = await proxyPost(
            delMessage,
            server
          );
        }
        if (delMessage.createdAt.getTime() < twoWeeksAgo) {
          delMessage.delete();
          return;
        }
        if (delMessage.channel.id in channelToMessages) {
          channelToMessages[delMessage.channel.id].messageIds.push(
            delMessage.id
          );
        } else {
          channelToMessages[delMessage.channel.id] = {
            channel: delMessage.channel as TextChannel,
            messageIds: [delMessage.id],
          };
        }
      }

      for (const bulkMsgs of Object.values(channelToMessages)) {
        await bulkMsgs.channel.bulkDelete(bulkMsgs.messageIds);
      }
    }
    safeDelete(message);
    deleteAfter(
      await message.channel.send(
        successEmbed(
          `Deleted ${pluralCount('message', 's', deletingMessages.length)}`
        )
      )
    );

    await notifyDeletes(deletingMessages, messagedWithImages, server, message);
  },
};

export default command;
