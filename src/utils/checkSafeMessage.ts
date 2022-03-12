import {
  Guild,
  GuildMember,
  Message,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { Bot } from '@/types';
import { isNotDM } from './typeGuards';

interface SafeMessage extends Message {
  guild: Guild;
  member: GuildMember;
  channel: TextChannel | ThreadChannel;
}

function checkSafeMessage(bot: Bot, message: Message): message is SafeMessage {
  if (!isNotDM(message)) return false; // DM
  if (message.author.bot || message.system) return false; // Don't care about other bots
  if (/^(,,?,?|[.>\[$=+%&]|[tk]!|-h|\.\.\. )[a-zA-Z]/.test(message.content)) {
    // TODO make this configurable per server
    return false; // Bot commands
  }

  const server = bot.servers[message.guild.id];
  if (message.content.startsWith(server.config.prefix)) {
    return false; // This bot's command
  }
  return true;
}

export default checkSafeMessage;
