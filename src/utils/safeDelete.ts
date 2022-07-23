import { Message } from 'discord.js';
import { GuildMessage } from '@/types';

export function safeDelete(message: GuildMessage) {
  const me = message.guild.members.me;
  if (!me) return;
  if (
    me.permissions.has('ManageMessages') ||
    message.channel.permissionsFor(me)?.has('ManageMessages')
  ) {
    setTimeout(() => message.delete().catch((e) => {}), 200); // Delay a little to let Discord UI actually delete the message
  }
}

export function deleteAfter(message?: Message, seconds = 5) {
  setTimeout(async () => {
    message?.delete().catch((e) => {});
  }, seconds * 1000);
}
