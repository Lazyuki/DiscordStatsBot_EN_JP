import { Message } from 'discord.js';
import { GuildMessage } from '@/types';

export function safeDelete(message: GuildMessage<Message>) {
  const me = message.guild.me;
  if (me && message.channel.permissionsFor(me).has('MANAGE_MESSAGES')) {
    setTimeout(() => message.delete(), 100); // Delay a little to let Discord UI actually delete the message
  }
}
