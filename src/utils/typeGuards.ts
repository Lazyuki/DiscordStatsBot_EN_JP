import { GuildMessage } from '@/types';
import {
  Guild,
  GuildMember,
  Message,
  NewsChannel,
  PartialMessage,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

export function isNotDM<M extends Message | PartialMessage>(
  message: M
): message is GuildMessage<M> {
  return Boolean(
    message.channel.type !== 'DM' && message.guild && message.member
  );
}
