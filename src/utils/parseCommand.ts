import Server from '@classes/Server';
import { Message } from 'discord.js';
import { BotCommand, ParsedBotCommand } from '../types';
import { PERMISSIONS } from './checkPermissions';
import { camelCaseToNormal } from './formatString';

export default function parseCommand(
  {
    isAllowed,
    allowedServers,
    requiredServerConfigs,
    ...restCommand
  }: BotCommand,
  categoryName: string
): ParsedBotCommand {
  const parsedCommand = {
    ...restCommand,
    category: camelCaseToNormal(categoryName),
  } as ParsedBotCommand;
  const allowFunctions: typeof parsedCommand.isAllowed[] = [];
  if (allowedServers) {
    allowFunctions.push((_, server) =>
      allowedServers.includes(server.guild.id)
    );
  }
  if (requiredServerConfigs) {
    allowFunctions.push((_, server) =>
      requiredServerConfigs.every((configKey) => {
        const config = server.config[configKey];
        if (!config) return false;
        if (Array.isArray(config)) return config.length > 0;
        return true;
      })
    );
  }
  if (typeof isAllowed === 'string') {
    allowFunctions.push(PERMISSIONS[isAllowed]);
  } else if (typeof isAllowed === 'function') {
    allowFunctions.push(isAllowed);
  }

  if (allowFunctions.length) {
    parsedCommand.isAllowed = (message, server, bot) =>
      allowFunctions.every((f) => f(message, server, bot));
  } else {
    parsedCommand.isAllowed = () => true;
  }
  return parsedCommand;
}
