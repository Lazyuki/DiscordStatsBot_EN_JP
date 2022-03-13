import fs from 'fs';

import { BotEvent } from '@/types';
import logger from '@/logger';
import Server from '@classes/Server';
import { dbInsertServer } from '@database/statements';
import { RESTART_TMP_FILE } from '@tasks/exitTask';

const event: BotEvent<'ready'> = {
  eventName: 'ready',
  once: true,
  skipOnDebug: false,
  processEvent: async (bot) => {
    for (const guild of bot.guilds.cache.values()) {
      bot.servers[guild.id] = new Server(guild, bot);
      dbInsertServer.run({ guildId: guild.id });
    }
    logger.info(`===========================================`);
    logger.info(`READY! Logged in as ${bot.user?.tag}`);
    bot.botInits.forEach((init) => init(bot));
    if (fs.existsSync(RESTART_TMP_FILE)) {
      const killedChannel = fs.readFileSync(RESTART_TMP_FILE, 'utf8');
      fs.unlinkSync(RESTART_TMP_FILE);
      const [guildId, channelId] = killedChannel.split('-');
      if (guildId && channelId) {
        const guild = bot.guilds.cache.get(guildId);
        if (guild) {
          const channel = guild.channels.cache.get(channelId);
          if (channel?.isText()) {
            await channel.send("I'm back online");
          }
        }
      }
    }
  },
};

export default event;
