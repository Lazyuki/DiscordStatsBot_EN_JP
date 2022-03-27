import { GuildMessage } from '@/types';
import {
  TextChannel,
  NewsChannel,
  ThreadChannel,
  Guild,
  PartialMessage,
  Message,
  GuildMember,
} from 'discord.js';

export function isNotDM<M extends Message | PartialMessage>(
  message: M
): message is GuildMessage<M> {
  return Boolean(
    message.channel.type !== 'DM' && message.guild && message.member
  );
}

export function getParentChannelId(
  channel: TextChannel | NewsChannel | ThreadChannel
) {
  if (channel.isThread()) {
    return channel.parentId!;
  } else {
    return channel.id;
  }
}

export function getCategoryId(
  channel: TextChannel | NewsChannel | ThreadChannel
) {
  if (channel.isThread()) {
    return channel.parent?.parentId;
  } else {
    return channel.parentId;
  }
}

export function isInChannelOrCategory(
  message: GuildMessage<Message>,
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
  message: GuildMessage<Message>,
  channelIds: string[]
) {
  return channelIds.some((id) => isInChannelOrCategory(message, id));
}

export function isMessageInChannels(
  message: GuildMessage<Message>,
  channelIds: string[]
) {
  return channelIds.some((channelId) =>
    isInChannelOrCategory(message, channelId)
  );
}

export function getTextChannel(guild: Guild, channelId?: string) {
  if (!channelId) return null;
  const channel = guild.channels.cache.get(channelId);
  return channel?.isText() ? channel : null;
}
