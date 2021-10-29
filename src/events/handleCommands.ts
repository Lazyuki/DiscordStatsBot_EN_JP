import { BotEvent } from "../types";
import logger from "../logger";

const event: BotEvent<"messageCreate"> = {
  eventName: "messageCreate",
  once: false,
  processEvent: async (bot, message) => {
    if (message.channel.type === "DM") return;
    if (message.author.bot || message.system) return;
    if (!message.guild) return;

    let server = bot.servers[message.guild.id];
    let serverOverride = false;
    const match = message.content.match(/^!!(\d+),/);
    if (match && message.author.id === bot.ownerId) {
      server = bot.servers[match[1]];
      message.content = message.content.replace(/^!!\d+/, "");
      serverOverride = true;
    }

    // Changes my server to EJLX
    let mine = false;
    if (server === undefined) {
      server = bot.servers["189571157446492161"];
      mine = true;
    }

    // Member is not cached?
    if (!message.member) {
      logger.warn(
        `Member is null for guild:${message.guild.id} message:${message.content}`
      );
      return;
    }
    // Is it not a command?
    if (!message.content.startsWith(server.prefix)) {
      if (!mine && !serverOverride) server.processNewMessage(message, bot);
      return;
    }
    // Separate the command and the content
    const commandName = message.content.split(" ")[0].slice(1).toLowerCase();
    const content = message.content.substr(commandName.length + 2).trim();
    const command = bot.commands.get(commandName);
    if (command) {
      // if Ciri's command
      if (command.isAllowed(message, server, bot) && command.normalCommand) {
        // Check permission
        try {
          await command.normalCommand(content, message, bot, server, cmds);
        } catch (e) {
          switch (e.type) {
            case "USER_MISSING_PERMISSION": {
              message.channel.send(
                `You do not have permissions: ${e.permissions}`
              );
              return;
            }
            case "BOT_MISSING_PERMISSION": {
              message.channel.send(`I need the permission: ${e.permissions}`);
              return;
            }
            case "INVALID_SYNTAX": {
              message.channel.send(`Invalid Syntax: ${command.help}`);
              return;
            }
            default: {
              message.channel.send(`Unexpected Error Occurred`);
            }
          }
        }
        return;
      }
    }
    if (!mine && !serverOverride) server.processNewMessage(message, bot); // Wasn't a valid command, so process it
  },
};

export default event;
