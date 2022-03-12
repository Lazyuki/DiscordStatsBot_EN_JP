import { BotEvent } from '@/types';
import { DM_MOD_BOT, EJLX, MAINICHI } from '@utils/constants';
import isRateLimited from '@utils/rateLimit';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    // Direct message.
    if (message.channel.type !== 'DM') return;
    if (message.author.bot) return;
    // Max 1 message / second
    if (isRateLimited(`DM_${message.author.id}`, 10)) return;
    // Check EJLX user
    const ejlxMember = bot.servers[EJLX]?.guild.members.cache.get(
      message.author.id
    );
    const mainichiMember = bot.servers[MAINICHI]?.guild.members.cache.get(
      message.author.id
    );
    if (ejlxMember) {
      await message.channel.send(
        `If you need to talk to the mods of "English-Japanese Language Exchange" then please DM <@${DM_MOD_BOT}> instead.`
      );
    }
    if (mainichiMember) {
      await message.channel.send(
        `If you need to talk to the mods of "毎日英語と日本語" then please DM one of the Welcoming Party members instead.`
      );
    }
    if (!ejlxMember && !mainichiMember) {
      await message.channel.send(
        `If you need to talk to the moderators, please contact them directly as this bot is not monitored.`
      );
    }
  },
};

export default event;
