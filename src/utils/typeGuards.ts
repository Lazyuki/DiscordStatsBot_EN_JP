import {
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  PartialMessage,
} from 'discord.js';

export function isNotDM(
  message: Message | PartialMessage
): message is Message & {
  guild: Guild;
  member: GuildMember;
  channel: GuildChannel;
} {
  return Boolean(
    message.channel.type !== 'DM' && message.guild && message.member
  );
}
