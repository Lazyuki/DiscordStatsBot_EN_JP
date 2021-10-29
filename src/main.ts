import { config } from "dotenv";
import { Client, Collection, Intents } from "discord.js";
import fs from "fs";
import env from "env-var";

import deploySlashCommands from "./deploySlashCommands";
import { Bot, BotCommand, BotEvent, ParsedBotCommand } from "./types";
import parseCommand from "./utils/parseCommand";

// Must be the first line
config();

// Set up intents
const UNWANTED_INTENTS = [
  Intents.FLAGS.GUILD_INTEGRATIONS,
  Intents.FLAGS.GUILD_WEBHOOKS,
  Intents.FLAGS.GUILD_MESSAGE_TYPING,
  Intents.FLAGS.DIRECT_MESSAGE_TYPING,
];

// Init bot user
const client = new Client({
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
  intents: Object.values(Intents.FLAGS).filter(
    (flag) => !UNWANTED_INTENTS.includes(flag)
  ),
}) as Bot;

client.ownerId = env.get("OWNER_ID").required().asString();

// Gather commands
client.commands = new Collection<string, ParsedBotCommand>();
const commandFiles = fs
  .readdirSync("./build/commands")
  .filter((file: string) => file.endsWith(".js"));

for (const fileName of commandFiles) {
  const command = (await import(`./build/commands/${fileName}`)) as BotCommand;
  const commandName = fileName.replace(".js", "");
  const parsedCommand = parseCommand(command, commandName);
  client.commands.set(commandName, parsedCommand);
}

const eventFiles = fs
  .readdirSync("./build/events")
  .filter((file: string) => file.endsWith(".js"));

for (const fileName of eventFiles) {
  const event = (await import(`./build/events/${fileName}`)) as BotEvent<any>;
  if (event.once) {
    client.once(event.eventName, (...args) =>
      event.processEvent(client, ...args)
    );
  } else {
    client.on(event.eventName, (...args) =>
      event.processEvent(client, ...args)
    );
  }
}

client.login(env.get("DISCORD_TOKEN").required().asString());
// deploySlashCommands();
