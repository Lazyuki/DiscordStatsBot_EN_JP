import { BotEvent } from '../types';
import logger from '../logger';
import { TESTING_SERVER } from '../utils/constants';
import Server from '../classes/Server';
import { insertServer } from '@database/statements';

const event: BotEvent<'ready'> = {
  eventName: 'ready',
  once: true,
  processEvent(bot) {
    for (const guild of bot.guilds.cache.values()) {
      bot.servers[guild.id] = new Server(guild, bot);
      insertServer.run({ guildId: guild.id });
    }
    logger.info(`===========================================`);
    logger.info(`READY! Logged in as ${bot.user?.tag}`);
  },
};

export default event;
