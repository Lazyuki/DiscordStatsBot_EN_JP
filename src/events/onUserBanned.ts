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

const event: BotEvent<'guildBanAdd'> = {
  eventName: 'guildBanAdd',
  skipOnDebug: true,
  processEvent: async (bot, banInfo) => {
    const server = bot.servers[banInfo.guild.id];
    const bannedUserId = banInfo.user.id;
  },
};

export default event;
