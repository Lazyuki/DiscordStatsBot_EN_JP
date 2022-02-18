import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  ClientEvents,
  Guild,
  Interaction,
  Message,
  MessageOptions,
  MessagePayload,
} from 'discord.js';

import Server from './classes/Server';

export interface Bot extends Client {
  ownerId: string;
  servers: Record<string, Server>;
  commands: Record<string, ParsedBotCommand>;
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
  hidden?: boolean;
  rateLimitSeconds?: number;
  description: string;
  arguments?: string;
  examples?: string[];
  options?: string[];
  normalCommand?: (commandInfo: {
    commandContent: string;
    message: SafeMessage;
    server: Server;
    bot: Bot;
    prefix: string;
    send: (options: string | MessageOptions) => Promise<Message | undefined>;
    reply: (options: string | MessageOptions) => Promise<Message | undefined>;
  }) => void | Promise<void>;
  slashCommand?: SlashCommandBuilder;
  childCommands?: string[];
  parentCommand?: string;
  replyInteraction?: (interaction: Interaction) => void | Promise<void>;
}

export interface ParsedBotCommand extends BotCommand {
  name: string;
  category: string;
  isAllowed: (message: Message, server: Server, bot: Bot) => boolean;
}

export interface BotEvent<E extends keyof ClientEvents> {
  eventName: E;
  once: boolean;
  skipOnDebug?: boolean;
  processEvent: (bot: Bot, ...args: ClientEvents[E]) => void | Promise<void>;
  init?: (bot: Bot) => void;
  end?: (bot: Bot) => void;
}

// Extend the type from each command file
export interface ServerConfig {
  prefix: string;
}

// Extend the type from each command file
// holds temporary states that might be needed after crash/restarts
export interface ServerTemp {}

export type LangType = 'JP' | 'EN' | 'OL';
