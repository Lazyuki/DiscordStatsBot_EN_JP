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
): message is GuildMessage {
  if (!isNotDM(message)) return false; // DM
  if (!message.author || message.content === null) return false;
  if (message.author.bot || message.system) return false; // Don't care about other bots
  const server = bot.servers[message.guild.id];
  if (server.temp.ignoredBotPrefixRegex?.test(message.content)) {
    return false; // Other bots' commands
  }

  if (message.content.startsWith(server.config.prefix)) {
    return false; // This bot's command
  }
  return true;
}

export default checkSafeMessage;
