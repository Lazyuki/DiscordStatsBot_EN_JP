import { Guild, GuildChannel, GuildMember, Message } from 'discord.js';

export function isNotDM(message: Message): message is Message & {
  guild: Guild;
  member: GuildMember;
  channel: GuildChannel;
} {
  return Boolean(
    message.channel.type !== 'DM' && message.guild && message.member
  );
}
