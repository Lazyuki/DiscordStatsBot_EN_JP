import {
  GuildMember,
  Invite,
  PartialGuildMember,
  TextBasedChannel,
  Util,
} from 'discord.js';

import { insertVoiceSeconds } from '@database/statements';
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

const event: BotEvent<'guildMemberAdd'> = {
  eventName: 'guildMemberAdd',
  skipOnDebug: true,
  processEvent: async (bot, member) => {
    if (member.guild.id !== EJLX) return;
    const server = bot.servers[member.guild.id];
    const userLogChannelId = server.config.userLogChannel;
    const userLogChannel = getTextChannel(server.guild, userLogChannelId);
    if (!userLogChannel) return;
    if (server.data.quickban) {
      const { time, link, regex } = server.data.quickban;
    }
  },
};

export default event;
