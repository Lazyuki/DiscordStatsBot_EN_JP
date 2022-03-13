import { TextChannel, NewsChannel, ThreadChannel, Guild } from 'discord.js';

export function getParentChannelId(
  channel: TextChannel | NewsChannel | ThreadChannel
) {
  if (channel.isThread()) {
    return channel.parentId!;
  } else {
    return channel.id;
  }
}

export function getTextChannel(guild: Guild, channelId?: string) {
  if (!channelId) return null;
  const channel = guild.channels.cache.get(channelId);
  return channel?.isText() ? channel : null;
}
