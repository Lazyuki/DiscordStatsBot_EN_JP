import { BotEvent } from '@/types';
import { insertVoiceSeconds } from '@database/statements';
import { Collection, VoiceBasedChannel, VoiceState } from 'discord.js';

declare module '@/types' {
  interface ServerTemp {
    vc: Record<string, number>;
  }
}

export function isVoiceActive(voiceState: VoiceState) {
  return (
    voiceState.channel &&
    voiceState.channelId !== voiceState.guild.afkChannelId &&
    !voiceState.deaf
  );
}

export function getSecondDiff(now: number, then: number) {
  return Math.round((now - then) / 1000);
}

const event: BotEvent<'voiceStateUpdate'> = {
  eventName: 'voiceStateUpdate',
  skipOnDebug: false,
  processEvent: async (bot, oldVoiceState, newVoiceState) => {
    if (oldVoiceState.member?.user.bot) return;
    const server = bot.servers[oldVoiceState.guild.id];
    if (!server.config.statistics) return; // No statistics for this server
    const userId = oldVoiceState.id;
    const now = new Date().getTime();
    if (!isVoiceActive(oldVoiceState) && isVoiceActive(newVoiceState)) {
      // Started voice
      server.temp.vc[userId] = now;
    } else if (isVoiceActive(oldVoiceState) && !isVoiceActive(newVoiceState)) {
      if (server.temp.vc[userId]) {
        const secondCount = getSecondDiff(now, server.temp.vc[userId]);
        insertVoiceSeconds({
          guildId: oldVoiceState.guild.id,
          userId,
          secondCount,
          date: bot.utcDay,
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
          if (isVoiceActive(member.voice)) {
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
        insertVoiceSeconds({
          guildId: server.guild.id,
          userId,
          secondCount,
          date: bot.utcDay,
        });
      }
    }
  },
};

export default event;
