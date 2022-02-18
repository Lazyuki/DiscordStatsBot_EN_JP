import { BotEvent } from '../types';
import { dbInsertVoiceSeconds } from '@database/statements';
import { GuildMember, PartialGuildMember, TextBasedChannel } from 'discord.js';
import { getToday } from '@utils/formatStats';
import { makeEmbed } from '@utils/embed';
import { EJLX, EWBF, RAI } from '@utils/constants';
import { getSecondDiff } from './onVoiceUpdate';

async function notifyUserLeave(
  member: PartialGuildMember | GuildMember,
  channel: TextBasedChannel
) {
  await channel.send(
    makeEmbed({
      color: '#c13c35',
      description: `📤 **${member.user.tag}** has \`left\` the server. (${member.id})`,
      footer: `User Leave (${member.guild.memberCount})`,
      footerIcon: member.user.displayAvatarURL(),
      timestamp: true,
    })
  );
}

declare module '@/types' {
  interface ServerTemp {
    vc: Record<string, number>;
  }
}

const event: BotEvent<'guildMemberRemove'> = {
  eventName: 'guildMemberRemove',
  once: false,
  processEvent: async (bot, member) => {
    const server = bot.servers[member.guild.id];
    if (server.temp.vc[member.id]) {
      // When a user leaves/get banned while in VC
      const secondCount = getSecondDiff(
        new Date().getTime(),
        server.temp.vc[member.id]
      );
      dbInsertVoiceSeconds.run({
        guildId: member.guild.id,
        userId: member.id,
        secondCount,
        date: getToday(),
      });
      delete server.temp.vc[member.id];
    }

    if (member.guild.id === EJLX) {
      const ewbfChannel = member.guild.channels.cache.get(EWBF);
      if (!ewbfChannel?.isText()) return;
      if (member.guild.members.cache.get(RAI)?.presence?.status === 'offline') {
        await notifyUserLeave(member, ewbfChannel);
      } else {
        setTimeout(async () => {
          const messages = await ewbfChannel.messages.fetch({ limit: 20 });
          for (const [, msg] of messages) {
            if (
              msg.author.id === RAI &&
              msg.embeds.length &&
              msg.embeds[0].description?.includes(member.id)
            )
              // Rai was working
              return;
          }
          await notifyUserLeave(member, ewbfChannel);
        }, 5000);
      }
    }
  },
};

export default event;
