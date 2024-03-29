import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  ClientEvents,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  Interaction,
  Message,
  ButtonStyle,
  MessageCreateOptions,
  NewsChannel,
  PartialMessage,
  PermissionsString,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
  ForumChannel,
  StageChannel,
} from 'discord.js';

import Server from './classes/Server';

export type AppCommandBuilder = { toJSON: () => any };

export interface Bot extends Client {
  ownerId: string;
  servers: Record<string, Server>;
  commands: Record<string, ParsedBotCommand>;
  commandInits: OnCommandInit[];
  botInits: OnBotInit[];
  botExits: OnBotExit[];
  serverInits: OnCommandInit[];
  serverConfigInits: OnCommandInit[];
  applicationCommands: AppCommandBuilder[];
  config: BotConfig;
  bogLogChannel?: TextChannel;
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
  | 'EJLX_MOD_CATEGORY'
  | 'MAINICHI_COMMITTEE'
  | PermissionsString;

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

export type GuildTextChannel =
  | TextChannel
  | NewsChannel
  | VoiceChannel
  | StageChannel;
export type GuildTextParentChannel = GuildTextChannel | ForumChannel;
export type GuildMessage<M extends Message | PartialMessage = Message> = M & {
  guild: Guild;
  member: GuildMember;
  channel: GuildTextBasedChannel;
};

export interface BotCommand {
  name: string;
  aliases?: string[];
  allowedServers?: string[];
  requiredServerConfigs?: (keyof ServerConfig)[];
  requiredBotPermissions?: PermissionsString[];
  /**
   * If array of permission levels, then it will be "true" if any of the permissions returns true
   */
  isAllowed?:
    | CommandPermissionLevel[]
    | ((message: GuildMessage, server: Server, bot: Bot) => boolean);
  hidden?: boolean;
  rateLimitSeconds?: number;
  description: string;
  arguments?: string | string[];
  examples?: (string | [string, string])[];
  options?: CommandOption[];
  normalCommand?: (commandInfo: {
    content: string;
    message: GuildMessage;
    server: Server;
    bot: Bot;
    prefix: string;
    options: ResolvedCommandOptions;
    send: (
      options: string | MessageCreateOptions
    ) => Promise<Message | undefined>;
    reply: (
      options: string | MessageCreateOptions
    ) => Promise<Message | undefined>;
  }) => void | Promise<void>;
  applicationCommand?: AppCommandBuilder;
  childCommands?: string[];
  subCommands?: string[];
  parentCommand?: string;
  replyInteraction?: (interaction: Interaction) => void | Promise<void>;
  onCommandInit?: OnCommandInit;
  onServerInit?: OnCommandInit;
  onBotInit?: OnBotInit;
  onBotExit?: OnBotExit;
}

/**
 * "F" Saturday, July 31, 2021 3:45 PM (default)
 * "d" 07/31/2021
 * "f" July 31, 2021 3:45 PM
 * "t" 3:45 PM
 * "D" July 31, 2021
 * "R" 10 minutes ago
 * "T" 3:45:12 PM
 */
export type TimestampFlag = 'F' | 'd' | 'f' | 't' | 'D' | 'R' | 'T';

export type ResolvedCommandOptions = Record<string, boolean | string>;

export interface ParsedBotCommand extends BotCommand {
  name: string;
  category: string;
  isAllowed: (message: GuildMessage, server: Server, bot: Bot) => boolean;
  isCirillaCommand?: boolean;
}

export interface BotEvent<E extends keyof ClientEvents> {
  eventName: E;
  once?: boolean;
  skipOnDebug: boolean;
  processEvent: (bot: Bot, ...args: ClientEvents[E]) => void | Promise<void>;
  onServerInit?: OnCommandInit;
  onBotInit?: OnBotInit;
  onBotExit?: OnBotExit;
}

export type ModLogType = 'warn' | 'mute' | 'voicemute';

export interface ModLogEntry {
  guildId: string;
  userId: string;
  date: string; // ISO
  issuerId: string;
  messageLink: string;
  kind: ModLogType;
  silent: boolean;
  content: string;
  duration: number | null; // milliseconds
}

export interface QuickBanConfig {
  time: number;
  link: string;
  regexStr: string;
  ignoreCase: boolean;
}

export type PartialInvite = { code: string; inviter: string };
export type MemberJoinInvites = PartialInvite[];

export type NotifyType = 'OFFLINE' | 'ALWAYS' | 'NEVER';
export type RoleNotifyType = NotifyType | 'OFFLINE_NOROLE';
export interface LineNotifyConfig {
  userMention: NotifyType;
  activeStaff: NotifyType | 'OFFLINE_NOROLE';
  lineNotifyToken: string;
}

export interface SimpleButton {
  id: string;
  label: string;
  style: ButtonStyle;
  disabled?: boolean;
}

export interface DeletedMessageAttachment {
  messageId: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  bytes: number; // only for attachments, not for embed
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
    | 'z'
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'S'
    | 'T'
    | 'U'
    | 'V'
    | 'W'
    | 'X'
    | 'Y'
    | 'Z'; // 1 letter string. can be used as -short
  bool: boolean; // whether it takes an argument
  description: string;
}
