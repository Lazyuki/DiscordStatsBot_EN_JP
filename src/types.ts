import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  ClientEvents,
  Collection,
  Guild,
  Interaction,
  Message,
} from 'discord.js';

import Server from './classes/Server';

export interface Bot extends Client {
  ownerId: string;
  servers: Record<string, Server>;
  commands: Collection<string, ParsedBotCommand>;
  commandInits: CommandInit[];
}

export type CommandPermissionLevel =
  | 'BOT_OWNER'
  | 'ADMIN'
  | 'SERVER_MODERATOR'
  | 'EJLX_STAFF'
  | 'MINIMO'
  | 'WP'
  | 'MUTE_MEMBERS'
  | 'BAN_MEMBERS'
  | 'KICK_MEMBERS';

export type BotCommandCategory =
  | 'Moderation'
  | 'Statistics'
  | 'Utility'
  | 'Quotes'
  | 'Miscellaneous'
  | 'Bot Owner';

export type CommandInit = (serverConfigJson: Partial<ServerConfig>) => void;
export type SafeMessage = Message & { guild: Guild };

export interface BotCommand {
  aliases?: string[];
  allowedServers?: string[];
  init?: CommandInit;
  isAllowed?:
    | CommandPermissionLevel
    | ((message: Message, server: Server, bot: Bot) => boolean);
  description: string;
  arguments?: string;
  examples?: string[];
  help?: string | ((message: Message, bot: Bot, prefix: string) => string);
  normalCommand?: (commandInfo: {
    commandContent: string;
    message: SafeMessage;
    server: Server;
    bot: Bot;
    prefix: string;
  }) => void | Promise<void>;
  slashCommand?: SlashCommandBuilder;
  replyInteraction?: (interaction: Interaction) => void | Promise<void>;
}

export interface ParsedBotCommand extends BotCommand {
  name: string;
  isAllowed: (message: Message, server: Server, bot: Bot) => boolean;
  help: (message: Message, bot: Bot, prefix: string) => string;
}

export interface BotEvent<E extends keyof ClientEvents> {
  eventName: E;
  once: boolean;
  processEvent: (bot: Bot, ...args: ClientEvents[E]) => void | Promise<void>;
}

// Extend the type from each command file
export interface ServerConfig {
  prefix: string;
}

// Extend the type from each command file
// holds temporary states that might be needed after crash/restarts
export interface ServerTemp {}
