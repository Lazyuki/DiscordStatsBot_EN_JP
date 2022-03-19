import {
  GuildMember,
  Invite,
  PartialGuildMember,
  TextBasedChannel,
  Util,
} from 'discord.js';

import { dbInsertVoiceSeconds } from '@database/statements';
import { getToday } from '@utils/formatStats';
import { makeEmbed } from '@utils/embed';
import {
  EJLX,
  EWBF,
  JHO,
  MEE6,
  PING_PARTY,
  RAI,
  SERVER_RULES,
} from '@utils/constants';
import { BotEvent } from '@/types';
import { getSecondDiff } from './onVoiceUpdate';
import { stripIndents } from 'common-tags';
import { getTextChannel } from '@utils/guildUtils';

async function notifyUserJoin(
  member: GuildMember,
  channel: TextBasedChannel,
  invite?: Invite
) {
  await channel.send(
    makeEmbed({
      color: '#84a332',
      description: `📥 **${Util.escapeMarkdown(
        member.user.tag
      )}** has \`joined\` the server. (${member.id})`,
      footer: `User Join (Members: ${member.guild.memberCount})${
        invite
          ? `\nInvite: ${invite.code} from ${
              invite.inviter?.username || 'vanity URL'
            }`
          : ''
      }`,
      footerIcon: member.user.displayAvatarURL(),
      timestamp: true,
    })
  );
}

async function welcomeToEJLX(member: GuildMember, channel: TextBasedChannel) {
  await channel.send(
    stripIndents`
    Welcome ${member}. Please read <#${SERVER_RULES}}> and tell us what your native language is!\n
    ${member}、ようこそ! あなたの母語を教えてください! 注意事項は<#${SERVER_RULES}}>に書いてあります。 <@&${PING_PARTY}>
    `
  );
}

const event: BotEvent<'guildMemberAdd'> = {
  eventName: 'guildMemberAdd',
  skipOnDebug: true,
  processEvent: async (bot, member) => {
    const server = bot.servers[member.guild.id];
    server.temp.newUsers.push(member.id);
    if (server.temp.newUsers.length > 5) {
      server.temp.newUsers.shift();
    }
    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return;
    // EJLX has special routines
    if (member.guild.id === EJLX) {
      if (member.guild.members.cache.get(RAI)?.presence?.status === 'offline') {
        await notifyUserJoin(member, userLogChannel);
      } else {
        setTimeout(async () => {
          const messages = await userLogChannel.messages.fetch({ limit: 20 });
          for (const [, msg] of messages) {
            if (
              msg.author.id === RAI &&
              msg.embeds.length &&
              msg.embeds[0].description?.includes(member.id)
            )
              // Rai was working
              return;
          }
          await notifyUserJoin(member, userLogChannel);
        }, 5000);
      }
      const jho = getTextChannel(server.guild, JHO);
      if (!jho) return;
      if (member.guild.members.cache.get(MEE6)?.presence?.status == 'offline') {
        await welcomeToEJLX(member, jho);
      } else {
        setTimeout(async () => {
          const messages = await jho.messages.fetch({ limit: 30 });
          for (const [, msg] of messages) {
            if (msg.author.id === MEE6 && msg.content.includes(member.id)) {
              // Mee6 welcomed them
              return;
            }
          }
          await welcomeToEJLX(member, jho);
        }, 5000);
      }
    } else {
      // If not EJLX but has user join notification enabled
      await notifyUserJoin(member, userLogChannel);
    }
  },
};

export default event;
