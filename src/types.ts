import { SlashCommandBuilder } from "@discordjs/builders";
import {
  Client,
  ClientEvents,
  Collection,
  Guild,
  Interaction,
  Message,
} from "discord.js";

import Server from "./classes/Server";

export interface Bot extends Client {
  ownerId: string;
  servers: Record<string, Server>;
  commands: Collection<string, ParsedBotCommand>;
}

export type CommandPermissionLevel =
  | "BOT_OWNER"
  | "ADMIN"
  | "SERVER_MODERATOR"
  | "EJLX_STAFF"
  | "MINIMO"
  | "WP";

export type BotCommandCategory =
  | "Moderation"
  | "Statistics"
  | "Utility"
  | "Quotes"
  | "Miscellaneous"
  | "Bot Owner";

export interface BotCommand {
  aliases?: string[];
  allowedServers?: string[];
  init?: (serverSettings: ServerSettings, savedJson: any) => any;
  isAllowed?:
    | CommandPermissionLevel
    | ((message: Message, server: Server, bot: Bot) => boolean);
  description: string;
  arguments?: string;
  examples?: string[];
  help?: string | ((message: Message, bot: Bot, prefix: string) => string);
  normalCommand?: (
    content: string,
    message: Message & { guild: Guild },
    server: Server,
    bot: Bot
  ) => void | Promise<void>;
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

// tslint:disable-next-line:no-empty-interface
export interface ServerSettings {}
