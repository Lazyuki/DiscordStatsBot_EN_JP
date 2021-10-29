import { BotEvent } from "../types";
import logger from "../logger";
import { TESTING_SERVER } from "../utils/constants";
import Server from "../classes/Server";

const event: BotEvent<"ready"> = {
  eventName: "ready",
  once: true,
  processEvent(bot) {
    bot.servers = {};
    // client.usableEmotes = [];
    for (const guild of bot.guilds.cache.values()) {
      if (guild.id === TESTING_SERVER) continue;
      bot.servers[guild.id] = new Server(guild);
    }
    logger.info(`===========================================`);
    logger.info(`READY! Logged in as ${bot.user?.tag}`);
  },
};

export default event;
