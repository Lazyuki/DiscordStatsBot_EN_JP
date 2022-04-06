import fs from 'fs';

import { BotEvent } from '@/types';
import logger from '@/logger';
import Server from '@classes/Server';
import { insertServer } from '@database/statements';
import { RESTART_TMP_FILE } from '@tasks/exitTask';
import hourlyTask from '@tasks/hourlyTask';
import { successEmbed } from '@utils/embed';

const event: BotEvent<'ready'> = {
  eventName: 'ready',
  once: true,
  skipOnDebug: false,
  processEvent: async (bot) => {
    for (const guild of bot.guilds.cache.values()) {
      bot.servers[guild.id] = new Server(guild, bot);
      insertServer({ guildId: guild.id });
    }
    logger.info(`===========================================`);
    logger.info(`READY! Logged in as ${bot.user?.tag}`);
    bot.botInits.forEach((init) => init(bot));
    hourlyTask(bot);
    if (fs.existsSync(RESTART_TMP_FILE)) {
      const killedChannel = fs.readFileSync(RESTART_TMP_FILE, 'utf8');
      fs.unlinkSync(RESTART_TMP_FILE);
      const [guildId, channelId] = killedChannel.split('-');
      if (guildId && channelId) {
        const guild = bot.guilds.cache.get(guildId);
        if (guild) {
          const channel = guild.channels.cache.get(channelId);
          if (channel?.isText()) {
            await channel.send(successEmbed("I'm back online"));
          }
        }
      }
    }
  },
};

export default event;
