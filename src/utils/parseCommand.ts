import { BotCommand, ParsedBotCommand } from '../types';
import { PERMISSIONS } from './checkPermissions';

function titleCase(str: string) {
  const splitCapital = str.replace(/([A-Z])/, ' $1');
  return splitCapital[0].toUpperCase() + splitCapital.slice(1);
}

export default function parseCommand(
  { isAllowed, allowedServers, ...restCommand }: BotCommand,
  categoryName: string
): ParsedBotCommand {
  const parsedCommand = {
    ...restCommand,
    category: titleCase(categoryName),
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
