import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  ClientEvents,
  Guild,
  GuildMember,
  Interaction,
  Message,
  MessageOptions,
  MessagePayload,
  NewsChannel,
  PartialMessage,
  PermissionString,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

import Server from './classes/Server';

export interface Bot extends Client {
  ownerId: string;
  servers: Record<string, Server>;
  commands: Record<string, ParsedBotCommand>;
  commandInits: OnCommandInit[];
  botInits: OnBotInit[];
  botExits: OnBotExit[];
  botConfig: BotConfig;
  utcHour: string; // ISO
  utcDay: string; // ISO
}

export type LangType = 'JP' | 'EN' | 'OL';

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

export type OnCommandInit = (server: Server) => void;
export type OnBotInit = (bot: Bot) => void;
export type OnBotExit = (bot: Bot) => void;
export type GuildMessage<M extends Message | PartialMessage> = M & {
  guild: Guild;
  member: GuildMember;
  channel: NewsChannel | TextChannel | ThreadChannel;
};

export interface BotCommand {
  name: string;
  aliases?: string[];
  allowedServers?: string[];
  requiredServerConfigs?: (keyof ServerConfig)[];
  requiredBotPermissions?: PermissionString[];
  isAllowed?:
    | CommandPermissionLevel
    | ((message: Message, server: Server, bot: Bot) => boolean);
  hidden?: boolean;
  rateLimitSeconds?: number;
  description: string;
  arguments?: string;
  examples?: string[];
  options?: CommandOption[];
  normalCommand?: (commandInfo: {
    content: string;
    message: GuildMessage<Message>;
    server: Server;
    bot: Bot;
    prefix: string;
    options: ResolvedCommandOptions;
    send: (options: string | MessageOptions) => Promise<Message | undefined>;
    reply: (options: string | MessageOptions) => Promise<Message | undefined>;
  }) => void | Promise<void>;
  slashCommand?: SlashCommandBuilder;
  childCommands?: string[];
  subCommands?: string[];
  parentCommand?: string;
  replyInteraction?: (interaction: Interaction) => void | Promise<void>;
  onCommandInit?: OnCommandInit;
  onBotInit?: OnBotInit;
  onBotExit?: OnBotExit;
}

export interface CommandOption {
  name: string; // can be used as --name
  short:
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'; // 1 letter string. can be used as -short
  bool: boolean; // whether it takes an argument
  description: string;
}

export type ResolvedCommandOptions = Record<string, boolean | string>;

export interface ParsedBotCommand extends BotCommand {
  name: string;
  category: string;
  isAllowed: (message: Message, server: Server, bot: Bot) => boolean;
}

export interface BotEvent<E extends keyof ClientEvents> {
  eventName: E;
  once?: boolean;
  skipOnDebug: boolean;
  processEvent: (bot: Bot, ...args: ClientEvents[E]) => void | Promise<void>;
  onBotInit?: OnBotInit;
  onBotExit?: OnBotExit;
}

export type ModLogType = 'warn' | 'mute' | 'timeout' | 'voicemute' | 'log';

export interface ModLogEntry {
  guildId: string;
  userId: string;
  date: string; // ISO
  issuerId: string;
  messageLink: string;
  kind: ModLogType;
  silent: boolean;
  content: string;
}

// Extend the type from each command file
export interface ServerConfig {
  prefix: string;
}

// Extend the type from each command file
// holds temporary states that might be needed after crash/restarts
export interface ServerTemp {}
// Extend the type from each command file
// Schedules to keep track even if the bot crashes
export interface ServerSchedules {}

export interface ServerData {
  schedules: ServerSchedules;
}
// Config for the bot itself, to be shared across servers
export interface BotConfig {}
