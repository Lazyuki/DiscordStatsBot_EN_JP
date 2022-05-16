import { Message, PermissionString } from 'discord.js';

import Server from '../classes/Server';
import { Bot, CommandPermissionLevel, GuildMessage } from '../types';
import { COMMITTEE, EJLX, MINIMO, MODERATION, STAFF, WP } from './constants';
import {
  getCategoryId,
  getMessageTextChannel,
  getParentChannelId,
} from './guildUtils';

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

export function checkModCategory(message: Message, server: Server) {
  if (!checkEjlx(server)) return false;
  if (checkAdmin(message)) return true;
  if (
    message.channel.type !== 'DM' &&
    getCategoryId(message.channel) === MODERATION
  )
    return true;
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
  if (message.member?.permissions.has('MODERATE_MEMBERS')) return true;
  return false;
}

export function checkMainichiCommittee(message: GuildMessage) {
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

export function getPermission(
  permission: CommandPermissionLevel
): (message: GuildMessage, server: Server, bot: Bot) => boolean {
  switch (permission) {
    case 'BOT_OWNER':
      return checkBotOwner;
    case 'ADMIN':
      return checkAdmin;
    case 'EJLX_STAFF':
      return checkEjlxStaff;
    case 'EJLX_MOD_CATEGORY':
      return checkModCategory;
    case 'MINIMO':
      return checkMinimo;
    case 'WP':
      return checkWP;
    case 'SERVER_MODERATOR':
      return checkServerMod;
    case 'MAINICHI_COMMITTEE':
      return checkMainichiCommittee;
    default:
      return (message: GuildMessage) => checkSpecificPerm(message, permission);
  }
}
