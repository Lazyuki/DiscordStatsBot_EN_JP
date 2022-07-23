import {
  GuildMember,
  PartialGuildMember,
  TextBasedChannel,
  escapeMarkdown,
} from 'discord.js';

import { insertVoiceSeconds } from '@database/statements';
import { makeEmbed } from '@utils/embed';
import { EJLX, JHO, RAI } from '@utils/constants';
import { BotEvent } from '@/types';
import { getSecondDiff } from './onVoiceUpdate';
import { getTextChannel } from '@utils/guildUtils';

const event: BotEvent<'guildMemberRemove'> = {
  eventName: 'guildMemberRemove',
  skipOnDebug: true,
  processEvent: async (bot, member) => {
    const server = bot.servers[member.guild.id];
    if (server.temp.vc[member.id]) {
      // When a user leaves/get banned while in VC
      const secondCount = getSecondDiff(
        new Date().getTime(),
        server.temp.vc[member.id]
      );
      insertVoiceSeconds({
        guildId: member.guild.id,
        userId: member.id,
        secondCount,
        date: bot.utcDay,
      });
      delete server.temp.vc[member.id];
    }

    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return;

    if (member.guild.id === EJLX) {
      if (server.temp.newUsers.some((nu) => nu.id === member.id)) {
        const jho = getTextChannel(server.guild, JHO);
        if (jho) {
          const msgs = await jho.messages.fetch();
          for (const [, msg] of msgs) {
            if (msg.author.bot && msg.mentions.users.has(member.id)) {
              msg.react('📤');
            }
          }
        }
      }
      if (member.guild.members.cache.get(RAI)?.presence?.status === 'offline') {
        await notifyUserLeave(member, userLogChannel);
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
          await notifyUserLeave(member, userLogChannel);
        }, 5000);
      }
    } else {
      // If not EJLX but has user leave notification enabled
      await notifyUserLeave(member, userLogChannel);
    }
  },
};

async function notifyUserLeave(
  member: PartialGuildMember | GuildMember,
  channel: TextBasedChannel
) {
  await channel.send(
    makeEmbed({
      color: '#c13c35',
      description: `📤 **${escapeMarkdown(
        member.user.tag
      )}** has \`left\` the server. (${member.id})`,
      footer: `User Leave (Members: ${member.guild.memberCount})`,
      footerIcon: member.user.displayAvatarURL(),
      timestamp: true,
    })
  );
}

export default event;
