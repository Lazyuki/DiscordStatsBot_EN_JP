import { BotEvent } from '../types';
import { dbInsertVoiceSeconds } from '@database/statements';
import {
  Collection,
  GuildMember,
  PartialGuildMember,
  VoiceBasedChannel,
} from 'discord.js';
import { getToday } from '@utils/formatStats';

declare module '@/types' {
  interface ServerTemp {
    vc: Record<string, number>;
  }
}

export function isVoiceActive(member: PartialGuildMember | GuildMember) {
  return (
    member.voice.channel &&
    member.voice.channelId !== member.guild.afkChannelId &&
    !member.voice.deaf
  );
}

export function getSecondDiff(now: number, then: number) {
  return Math.round((now - then) / 1000);
}

const event: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: false,
  processEvent: async (bot, oldMember, newMember) => {
    if (oldMember.user.bot) return;
    const now = new Date().getTime();
    const server = bot.servers[oldMember.guild.id];
    const userId = oldMember.id;
    if (!isVoiceActive(oldMember) && isVoiceActive(newMember)) {
      // Started voice
      server.temp.vc[userId] = now;
    } else if (isVoiceActive(oldMember) && !isVoiceActive(newMember)) {
      if (server.temp.vc[userId]) {
        const secondCount = getSecondDiff(now, server.temp.vc[userId]);
        dbInsertVoiceSeconds.run({
          guildId: oldMember.guild.id,
          userId,
          secondCount,
          date: getToday(),
        });
        delete server.temp.vc[userId];
      }
    }
  },
  onBotInit: (bot) => {
    const now = new Date().getTime();
    for (const server of Object.values(bot.servers)) {
      server.temp.vc = {};
      const voiceChannelCollection = server.guild.channels.cache.filter((c) => {
        return c.isVoice(); // TODO: does it include stage?
      }) as Collection<string, VoiceBasedChannel>;
      voiceChannelCollection.forEach((channel) => {
        channel.members.forEach((member) => {
          if (member.user.bot) return;
          if (isVoiceActive(member)) {
            server.temp.vc[member.id] = now;
          }
        });
      });
    }
  },
  onBotExit: (bot) => {
    const now = new Date().getTime();
    for (const server of Object.values(bot.servers)) {
      for (const userId in server.temp.vc) {
        const secondCount = getSecondDiff(now, server.temp.vc[userId]);
        dbInsertVoiceSeconds.run({
          guildId: server.guild.id,
          userId,
          secondCount,
          date: getToday(),
        });
      }
    }
  },
};

export default event;
