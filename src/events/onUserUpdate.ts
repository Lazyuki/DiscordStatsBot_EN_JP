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
import { getTextChannel } from '@utils/discordGetters';

async function notifyNameChange(
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

const event: BotEvent<'guildMemberUpdate'> = {
  eventName: 'guildMemberUpdate',
  skipOnDebug: true,
  processEvent: async (bot, oldMember, newMember) => {
    const server = bot.servers[newMember.guild.id];
    if (!server.config.logNameChanges) return;
    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return;
  },
};

export default event;
