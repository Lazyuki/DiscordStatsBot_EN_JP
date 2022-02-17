import { TextChannel, NewsChannel, ThreadChannel } from 'discord.js';

import { BotEvent } from '@/types';
import { isNotDM } from '@utils/typeGuards';
import { insertMessages } from '@database/statements';
import { getToday } from '@utils/formatStats';
import checkLang from '@utils/checkLang';

function getChannelId(channel: TextChannel | NewsChannel | ThreadChannel) {
  if (channel.isThread()) {
    return channel.parentId!;
  } else {
    return channel.id;
  }
}

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  once: false,
  processEvent: async (bot, message) => {
    if (!isNotDM(message)) return; // DM
    if (!message.guild || !message.member) return; // DM
    if (message.author.bot || message.system) return;
    if (/^(,,?,?|[.>\[$=+%&]|[tk]!|-h)[a-zA-Z]/.test(message.content)) return; // Bot commands

    const server = bot.servers[message.guild.id];

    const guildId = message.guild.id;
    const channelId = getChannelId(message.channel);
    if (server.config.ignoredChannels.includes(channelId)) return;

    const userId = message.member.id;
    const date = getToday();
    const { lang } = checkLang(message.content);

    insertMessages.run({
      guildId,
      userId,
      channelId,
      date,
      lang,
      messageCount: 1,
    });
  },
};

export default event;
