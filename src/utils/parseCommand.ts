import { BotCommand, ParsedBotCommand } from '../types';
import { PERMISSIONS } from './checkPermissions';

export default function parseCommand(
  { isAllowed, allowedServers, ...restCommand }: BotCommand,
  commandName: string
): ParsedBotCommand {
  const parsedCommand = {
    ...restCommand,
    name: commandName,
  } as ParsedBotCommand;
  if (isAllowed === undefined) {
    if (allowedServers) {
      parsedCommand.isAllowed = (_, server) =>
        allowedServers.includes(server.guild.id);
    } else {
      parsedCommand.isAllowed = () => true;
    }
  } else if (typeof isAllowed === 'string') {
    parsedCommand.isAllowed = PERMISSIONS[isAllowed];
  }
  return parsedCommand;
}
