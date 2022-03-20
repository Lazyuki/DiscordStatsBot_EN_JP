import {
  Guild,
  GuildMember,
  Message,
  PartialMessage,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { Bot, GuildMessage } from '@/types';
import { isNotDM } from './guildUtils';

function checkSafeMessage(
  bot: Bot,
  message: Message | PartialMessage
): message is GuildMessage<Message> {
  if (!isNotDM(message)) return false; // DM
  if (!message.author || message.content === null) return false;
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
