import { Message } from "discord.js";
import Server from "../classes/Server";
import { Bot, CommandPermissionLevel } from "../types";
import { EJLX, MINIMO, STAFF, WP } from "./ejlxConstants";

export function checkEjlx(server: Server) {
  return server.guild.id === EJLX;
}

export function checkAdmin(message: Message) {
  return message.member?.permissions.has("ADMINISTRATOR") || false;
}

export function checkBotOwner(message: Message, server: Server, bot: Bot) {
  return message.author.id === bot.ownerId;
}

export function checkEjlxStaff(message: Message, server: Server) {
  if (!checkEjlx(server)) return false;
  if (checkAdmin(message)) return true;
  if (message.member?.roles.cache.has(STAFF)) return true;
  return false;
}

export function checkMinimo(message: Message, server: Server) {
  if (!checkEjlx(server)) return false;
  if (checkEjlxStaff(message, server)) return true;
  if (message.member?.roles.cache.has(MINIMO)) return true;
  return false;
}

export function checkWP(message: Message, server: Server) {
  if (!checkEjlx(server)) return false;
  if (checkMinimo(message, server)) return true;
  if (message.member?.roles.cache.has(WP)) return true;
  return false;
}

export function checkServerMod(message: Message) {
  if (checkAdmin(message)) return true;
  if (message.member?.permissions.has("MANAGE_GUILD")) return true;
  return false;
}

export const PERMISSIONS: Record<
  CommandPermissionLevel,
  (message: Message, server: Server, bot: Bot) => boolean
> = {
  ADMIN: checkAdmin,
  BOT_OWNER: checkBotOwner,
  EJLX_STAFF: checkEjlxStaff,
  MINIMO: checkMinimo,
  WP: checkWP,
  SERVER_MODERATOR: checkServerMod,
};
