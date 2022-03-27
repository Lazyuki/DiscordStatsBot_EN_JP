import { Message, PermissionString } from 'discord.js';

import Server from '../classes/Server';
import { Bot, CommandPermissionLevel, GuildMessage } from '../types';
import { COMMITTEE, EJLX, MINIMO, STAFF, WP } from './constants';
import { getMessageTextChannel, getParentChannelId } from './guildUtils';

export function checkEjlx(server: Server) {
  return server.guild.id === EJLX;
}

export function checkAdmin(message: Message) {
  return message.member?.permissions.has('ADMINISTRATOR') || false;
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
  if (message.member?.permissions.has('MANAGE_GUILD')) return true;
  return false;
}

export function checkMainichiCommittee(message: GuildMessage<Message>) {
  const channelId = getParentChannelId(message.channel);
  return channelId === COMMITTEE;
}

export function checkSpecificPerm(
  message: Message,
  permission: PermissionString
) {
  return Boolean(message.member?.permissions.has(permission));
}

export function checkMuteMembers(message: Message) {}

export const PERMISSIONS: Record<
  CommandPermissionLevel,
  (message: GuildMessage<Message>, server: Server, bot: Bot) => boolean
> = {
  ADMIN: checkAdmin,
  BOT_OWNER: checkBotOwner,
  EJLX_STAFF: checkEjlxStaff,
  MINIMO: checkMinimo,
  WP: checkWP,
  SERVER_MODERATOR: checkServerMod,
  MAINICHI_COMMITTEE: checkMainichiCommittee,
  MUTE_MEMBERS: (message: Message) =>
    checkSpecificPerm(message, 'MUTE_MEMBERS'),
  BAN_MEMBERS: (message: Message) => checkSpecificPerm(message, 'BAN_MEMBERS'),
  KICK_MEMBERS: (message: Message) =>
    checkSpecificPerm(message, 'KICK_MEMBERS'),
};
