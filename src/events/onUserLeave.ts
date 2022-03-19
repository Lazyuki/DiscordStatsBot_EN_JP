import {
  GuildMember,
  PartialGuildMember,
  TextBasedChannel,
  Util,
} from 'discord.js';

import { dbInsertVoiceSeconds } from '@database/statements';
import { getToday } from '@utils/formatStats';
import { makeEmbed } from '@utils/embed';
import { EJLX, EWBF, RAI } from '@utils/constants';
import { BotEvent } from '@/types';
import { getSecondDiff } from './onVoiceUpdate';
import { getTextChannel } from '@utils/guildUtils';

async function notifyUserLeave(
  member: PartialGuildMember | GuildMember,
  channel: TextBasedChannel
) {
  await channel.send(
    makeEmbed({
      color: '#c13c35',
      description: `📤 **${Util.escapeMarkdown(
        member.user.tag
      )}** has \`left\` the server. (${member.id})`,
      footer: `User Leave (Members: ${member.guild.memberCount})`,
      footerIcon: member.user.displayAvatarURL(),
      timestamp: true,
    })
  );
}

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
      dbInsertVoiceSeconds.run({
        guildId: member.guild.id,
        userId: member.id,
        secondCount,
        date: getToday(),
      });
      delete server.temp.vc[member.id];
    }

    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return;

    if (member.guild.id === EJLX) {
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

export default event;
