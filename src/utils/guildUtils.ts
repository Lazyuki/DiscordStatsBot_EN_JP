import { GuildMessage } from '@/types';
import {
  TextChannel,
  NewsChannel,
  Guild,
  PartialMessage,
  Message,
  GuildBasedChannel,
  CategoryChannel,
  VoiceChannel,
  GuildTextBasedChannel,
  ChannelType,
} from 'discord.js';
import { REGEX_MESSAGE_LINK_OR_FULL_ID } from './regex';

export function isNotDM<M extends Message | PartialMessage>(
  message: M
): message is GuildMessage<M> {
  return Boolean(
    message.channel.type !== ChannelType.DM && message.guild && message.member
  );
}

export function getMessageTextChannel(message: GuildMessage) {
  if (message.channel.isThread()) {
    return message.channel.parent;
  } else {
    return message.channel;
  }
}

export function getParentChannelId(channel: GuildTextBasedChannel) {
  if (channel.isThread()) {
    return channel.parentId!;
  } else {
    return channel.id;
  }
}

export function getCategoryId(channel: GuildTextBasedChannel) {
  if (channel.isThread()) {
    return channel.parent?.parentId;
  } else {
    return channel.parentId;
  }
}

export function isTextChannel(
  channel: GuildBasedChannel
): channel is TextChannel | NewsChannel | VoiceChannel {
  return channel.type === ChannelType.GuildText && !channel.isThread();
}

export function isInChannelOrCategory(
  message: GuildMessage,
  channelOrCategoryId: string
) {
  const parentChannelId = getParentChannelId(message.channel);
  const categoryChannelId = getCategoryId(message.channel);
  return (
    channelOrCategoryId === parentChannelId ||
    channelOrCategoryId === categoryChannelId
  );
}

export function isInChannelsOrCategories(
  message: GuildMessage,
  channelIds: string[]
) {
  return channelIds.some((id) => isInChannelOrCategory(message, id));
}

export function channelsOrCategoriesToChannels(
  channdlOrCategoriIds: string[],
  guild: Guild
): string[] {
  const textChannelIds: string[] = [];
  channdlOrCategoriIds.forEach((id) => {
    const channel = guild.channels.cache.get(id);
    if (!channel) return;
    if (channel.type === ChannelType.GuildText && !channel.isThread()) {
      textChannelIds.push(channel.id);
    } else if (channel instanceof CategoryChannel) {
      const children = channel.children.cache.keys();
      textChannelIds.push(...children);
    }
  });
  return textChannelIds;
}

export function isMessageInChannels(
  message: GuildMessage,
  channelIds: string[]
) {
  return channelIds.some((channelId) =>
    isInChannelOrCategory(message, channelId)
  );
}

export function getTextChannel(guild: Guild, channelId?: string) {
  if (!channelId) return null;
  const channel = guild.channels.cache.get(channelId);
  return channel?.type === ChannelType.GuildText ? channel : null;
}

export function idToChannel(id: string) {
  return `<#${id}>`;
}
export function idToUser(id: string) {
  return `<@${id}>`;
}
export function idToRole(id: string) {
  return `<@&${id}>`;
}

export function messageToFullId(message: {
  channelId?: string;
  channel_id?: string;
  id: string;
}) {
  return `${message.channelId || message.channel_id}-${message.id}`;
}

export async function fetchMessage(guild: Guild, messageIdOrLink?: string) {
  if (!messageIdOrLink) return null;
  const match = messageIdOrLink.match(REGEX_MESSAGE_LINK_OR_FULL_ID);
  if (!match) return null;
  const [_, channelId, messageId] = match;
  const channel = getTextChannel(guild, channelId);
  const message = (await channel?.messages.fetch(messageId)) as GuildMessage;
  return message || null;
}
