import {
  GuildMember,
  PartialGuildMember,
  PartialUser,
  TextBasedChannel,
  User,
  Util,
} from 'discord.js';

import { makeEmbed } from '@utils/embed';
import { BotEvent } from '@/types';
import { getTextChannel } from '@utils/guildUtils';

const memberEvent: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMember, newMember) => {
    if (oldMember.nickname === newMember.nickname) return;
    const server = bot.servers[newMember.guild.id];
    if (!server.config.logNameChanges) return;
    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return;
    await notifyNicknameChange(oldMember, newMember, userLogChannel);
  },
};

const userEvent: BotEvent<'userUpdate'> = {
  eventName: 'userUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldUser, newUser) => {
    if (oldUser.tag === newUser.tag) return;
    for (const server of Object.values(bot.servers)) {
      if (!server.config.logNameChanges) continue;
      if (!server.guild.members.cache.has(newUser.id)) return; // user not in the server
      const userLogChannelId = server.config.userLogChannel;
      const userLogChannel = getTextChannel(server.guild, userLogChannelId);
      if (!userLogChannel) continue;
      await notifyUsernameChange(oldUser, newUser, userLogChannel);
    }
  },
};

async function sendNameChange(
  message: string,
  user: User,
  channel: TextBasedChannel
) {
  await channel.send(
    makeEmbed({
      color: '#4286f4',
      description: message,
      footer: `${user.tag} (${user.id})`,
      footerIcon: user.displayAvatarURL(),
      timestamp: true,
    })
  );
}

async function notifyNicknameChange(
  oldMember: PartialGuildMember | GuildMember,
  newMember: GuildMember,
  channel: TextBasedChannel
) {
  const oldNickname = oldMember.nickname;
  const newNickname = newMember.nickname;

  let message: string;
  if (!oldNickname) {
    message = `**${Util.escapeMarkdown(
      oldMember.user.username
    )}**'s nickname was set to **${Util.escapeMarkdown(newNickname || '')}**`;
  } else if (!newNickname) {
    message = `**${Util.escapeMarkdown(
      oldNickname || ''
    )}**'s nickname was removed`;
  } else {
    message = `**${Util.escapeMarkdown(
      oldNickname
    )}**'s nickname was changed to **${Util.escapeMarkdown(newNickname)}**`;
  }
  await sendNameChange(message, newMember.user, channel);
}

async function notifyUsernameChange(
  oldUser: PartialUser | User,
  newUser: User,
  channel: TextBasedChannel
) {
  const oldUserTag = oldUser.tag
    ? `**${Util.escapeMarkdown(oldUser.tag)}**`
    : `UserID: **${oldUser.id}**`;
  await sendNameChange(
    `${oldUserTag}'s username was changed to **${Util.escapeMarkdown(
      newUser.tag
    )}**`,
    newUser,
    channel
  );
}

export default [memberEvent, userEvent];
