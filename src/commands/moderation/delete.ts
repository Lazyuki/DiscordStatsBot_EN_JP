import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { stripIndent } from 'common-tags';
import {
  ChannelType,
  Message,
  AttachmentBuilder,
  NewsChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

import { CommandArgumentError } from '@/errors';
import logger from '@/logger';
import { BotCommand, DeletedMessageAttachment, GuildMessage } from '@/types';
import Server from '@classes/Server';
import { parseSnowflakeIds } from '@utils/argumentParsers';
import { getDiscordTimestamp, getExactDaysAgo } from '@utils/datetime';
import {
  errorEmbed,
  splitIntoMultipleEmbeds,
  successEmbed,
  warningEmbed,
} from '@utils/embed';
import {
  channelName,
  userToTagAndId,
  userToTagAndIdNoEscape,
} from '@utils/formatString';
import { getTextChannel, idToChannel } from '@utils/guildUtils';
import { MAX_BYTES } from '@utils/images';
import { pluralCount, pluralize } from '@utils/pluralize';
import {
  REGEX_MESSAGE_LINK_OR_FULL_ID,
  REGEX_RAW_ID,
  REGEX_URL,
  REGEX_USER,
} from '@utils/regex';
import { deleteAfter, safeDelete } from '@utils/safeDelete';
import { ADMIN, MINIMO, STAFF } from '@utils/constants';

const command: BotCommand = {
  name: 'delete',
  aliases: ['del'],
  isAllowed: ['SERVER_MODERATOR', 'MINIMO', 'MAINICHI_COMMITTEE'],
  options: [
    {
      name: 'noLog',
      short: 'n',
      description: 'Admins can use this option to skip the mod action logging',
      bool: true,
    },
  ],
  requiredBotPermissions: ['ManageMessages'],
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
    'del https://discord.com/channels/1234568 ... 115634688',
    'del 2',
    'del @geralt 3',
    'del 3 has:image',
    'del @geralt has:"ciri sucks"',
  ],
  normalCommand: async ({ content, message, server, options }) => {
    const guild = server.guild;
    const deletingMessages: GuildMessage[] = [];

    if (message.reference) {
      // Message reply
      const channel = getTextChannel(guild, message.reference.channelId);
      if (!channel || !message.reference.messageId) {
        throw new CommandArgumentError('Impossible message reference');
      }
      const delMessage = (await channel.messages.fetch(
        message.reference.messageId
      )) as GuildMessage;
      delMessage && deletingMessages.push(delMessage);
    } else {
      // Search messages
      const defaultChannel = message.mentions.channels.size
        ? getTextChannel(guild, message.mentions.channels.firstKey())
        : message.channel;
      if (defaultChannel?.type !== ChannelType.GuildText) {
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
          delMessage && deletingMessages.push(delMessage as GuildMessage);
        }
        const globalFullIdRegex = new RegExp(
          REGEX_MESSAGE_LINK_OR_FULL_ID,
          'g'
        );
        content = content
          .replaceAll(globalFullIdRegex, '')
          .replaceAll(REGEX_URL, '')
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
        try {
          for (const messageId of messageIds) {
            const delMessage = await defaultChannel.messages.fetch(messageId);
            delMessage && deletingMessages.push(delMessage as GuildMessage);
          }
        } catch (e) {
          await message.channel.send(
            errorEmbed(
              `The message ID did not match any message in <#${defaultChannel.id}>. To delete messages in other channels, use the full ID in the format \`123456789-123456789\` which you can copy by holding the shift key when clicking "Copy ID", or mention the channel first like \`${server.config.prefix}del #general 123456789\`.`
            )
          );
          return;
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
            deletingMessages.push(msg as GuildMessage);
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

    // Got all messages to delete

    if (deletingMessages.length === 0) {
      await message.channel.send(errorEmbed('No messages to delete'));
      return;
    }

    const notLogging =
      options['noLog'] && message.member.permissions.has('Administrator');

    const attachmentURLs: Record<string, DeletedMessageAttachment[]> = {}; // repost images
    const hasEmbedMessageIds: string[] = []; // Embed with videos/images means there was a URL.

    deletingMessages.forEach((m) => {
      if (m.attachments.size) {
        m.attachments.forEach((a) => {
          const isImage = a.contentType?.includes('image');
          const isVideo = a.contentType?.includes('video');
          const isAudio = a.contentType?.includes('audio');
          const format = a.contentType?.split('/')[1] || '';
          const name = a.name || `${a.id}.${format}`;
          if (isImage || isVideo || isAudio) {
            const delAttachment: DeletedMessageAttachment = {
              messageId: m.id,
              url: a.proxyURL,
              type: isImage ? 'image' : isVideo ? 'video' : 'audio',
              name,
              bytes: a.size,
            };
            if (m.id in attachmentURLs) {
              attachmentURLs[m.id].push(delAttachment);
            } else {
              attachmentURLs[m.id] = [delAttachment];
            }
          }
        });
      }
      if (m.embeds) {
        m.embeds.forEach((e) => {
          if (e.url) {
            hasEmbedMessageIds.push(m.id);
          } else if (e.video?.proxyURL) {
            hasEmbedMessageIds.push(m.id);
          }
        });
      }
    });

    const post = async () =>
      !notLogging &&
      (await postDeletedMessages(
        deletingMessages,
        attachmentURLs,
        hasEmbedMessageIds,
        server,
        message
      ));

    await message.channel.sendTyping();
    if (attachmentURLs.length) {
      // if there are attachments, post first so that proxyURL doesn't get deleted
      try {
        await post();
      } catch (e) {
        await message.channel.send(
          errorEmbed(`Failed to log the deleted messages`)
        );
      }
      await deleteMessages(deletingMessages);
    } else {
      await deleteMessages(deletingMessages);
      try {
        await post();
      } catch (e) {
        await message.channel.send(
          errorEmbed(`Failed to log the deleted messages`)
        );
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
  },
};

async function deleteMessages(deletingMessages: Message[]) {
  if (deletingMessages.length === 1) {
    await deletingMessages[0].delete();
    return;
  }
  const channelToMessages: Record<
    string,
    {
      channel: TextChannel | ThreadChannel | NewsChannel;
      messages: Message[];
    }
  > = {};
  const twoWeeksAgo = getExactDaysAgo(14).getTime(); // Discord can't bulk delete messages older than two weeks
  for (const delMessage of deletingMessages) {
    if (delMessage.createdAt.getTime() < twoWeeksAgo) {
      delMessage.delete();
      continue;
    }
    if (delMessage.channel.id in channelToMessages) {
      channelToMessages[delMessage.channel.id].messages.push(delMessage);
    } else {
      channelToMessages[delMessage.channel.id] = {
        channel: delMessage.channel as TextChannel,
        messages: [delMessage],
      };
    }
  }

  for (const bulkMsgs of Object.values(channelToMessages)) {
    if (bulkMsgs.messages.length === 1) {
      await bulkMsgs.messages[0].delete();
    } else {
      await bulkMsgs.channel.bulkDelete(bulkMsgs.messages);
    }
  }
}

async function postDeletedMessages(
  messages: GuildMessage[],
  attachmentURLs: Record<string, DeletedMessageAttachment[]>,
  hasEmbedsMessageIDs: string[],
  server: Server,
  commandMessage: GuildMessage
) {
  const channel = getTextChannel(
    server.guild,
    server.config.modActionLogChannel
  );
  if (!channel) return; // invalid config.

  const onlyOneUser = messages.every(
    (m) => m.author.id === messages[0].author.id
  );
  const onlyOneChannel = messages.every(
    (m) => m.channel.id === messages[0].channel.id
  );
  let attachmentNum = 1;
  const threadAttachments: {
    content?: string;
    attachments?: AttachmentBuilder[];
  }[] = [];

  const title = pluralize('Message', 's', messages.length);
  const fields = messages.map((message) => {
    const name = `${
      onlyOneUser ? '' : `👤${userToTagAndIdNoEscape(message.author)} `
    }${
      onlyOneChannel ? '' : `${channelName(message.channel)} `
    }${getDiscordTimestamp(message.createdAt, onlyOneUser ? 'f' : 't')}`;

    const hasAttachment = Boolean(
      hasEmbedsMessageIDs.includes(message.id) || attachmentURLs[message.id]
    );
    const attachmentIndicator = hasAttachment
      ? `\n__See attachment ${attachmentNum++}__`
      : '';
    if (hasAttachment) {
      let content: undefined | string = undefined;
      if (hasEmbedsMessageIDs.includes(message.id)) {
        const allUrls = message.content.match(REGEX_URL);
        if (allUrls) {
          content = allUrls.join('\n');
        }
      }
      const attachments: AttachmentBuilder[] = [];
      if (message.id in attachmentURLs) {
        const delAttachments = attachmentURLs[message.id];
        delAttachments.forEach((da) => {
          if (da.bytes > MAX_BYTES) {
            content += `\n${da.type} size exceeds the limit at ${da.bytes} bytes. SKIPPING`;
            return null;
          }
          const proxyAttachment = new AttachmentBuilder(da.url, {
            name: da.name,
          }).setSpoiler(true);
          attachments.push(proxyAttachment);
        });
      }
      threadAttachments.push({ content, attachments });
    }
    const value =
      message.content.length + attachmentIndicator.length > 1024
        ? `${message.content.substring(
            0,
            1000 - attachmentIndicator.length
          )}... (truncated)${attachmentIndicator}`
        : message.content + attachmentIndicator;

    return {
      name,
      value,
      inline: false,
    };
  });

  const embeds = splitIntoMultipleEmbeds({
    color: 'Red',
    authorIcon: onlyOneUser ? messages[0].author.displayAvatarURL() : undefined,
    authorName: `${title}${
      onlyOneUser ? ` from ${userToTagAndIdNoEscape(messages[0].author)}` : ''
    } Deleted`,
    description: onlyOneChannel ? `In ${messages[0].channel}` : undefined,
    fields,
    footer: `By ${commandMessage.author.tag} in ${channelName(
      commandMessage.channel
    )}`,
    footerIcon: commandMessage.member.displayAvatarURL(),
    timestamp: true,
  });
  const mainMessage = await channel.send(embeds[0]);
  if (embeds.length > 1) {
    embeds.slice(1).forEach((embed) => {
      channel
        .send(embed)
        .catch((e) =>
          logger.error(
            `Failed to send multi-embeds for the deleted message notification\n${
              (e as any).name
            }: ${(e as any).message}`
          )
        );
    });
  }
  if (Object.keys(attachmentURLs).length || hasEmbedsMessageIDs.length) {
    const thread = await mainMessage.startThread({
      name: 'Deleted Message Attachments',
      autoArchiveDuration: 60,
    });
    let index = 1;
    for (const threadAttachment of threadAttachments) {
      await thread.send({
        content: `Attachment ${index}\n${threadAttachment.content}`,
        files: threadAttachment.attachments?.length
          ? threadAttachment.attachments
          : undefined,
      });
      index++;
    }
    await thread.setArchived(true, 'Deleted Message Attachments');
  }
}

const contextMenu = new ContextMenuCommandBuilder()
  .setName('Delete and Log')
  .setType(3)
  .setDefaultPermission(false);

const permissions = [
  {
    id: MINIMO,
    type: 'ROLE',
    permission: true,
  },
  {
    id: STAFF,
    type: 'ROLE',
    permission: true,
  },
  {
    id: ADMIN,
    type: 'ROLE',
    permission: true,
  },
];

export default command;
