import { BotCommand, ParsedBotCommand } from "../types";
import { PERMISSIONS } from "./checkPermissions";

export default function parseCommand(
  command: BotCommand,
  commandName: string
): ParsedBotCommand {
  const parsedCommand = {
    ...command,
    name: commandName,
  } as ParsedBotCommand;
  if (!command.isAllowed) {
    parsedCommand.isAllowed = () => true;
  } else if (typeof command.isAllowed === "string") {
    parsedCommand.isAllowed = PERMISSIONS[command.isAllowed];
  }
  if (typeof command.help === "string") {
    parsedCommand.help = () => command.help as string;
  }
  return parsedCommand;
}
