import { config } from 'dotenv';
import { Client, Collection, Intents } from 'discord.js';
import fs from 'fs';
import env from 'env-var';

import logger from './logger';
import { Bot, BotCommand, BotEvent, ParsedBotCommand } from './types';
import parseCommand from './utils/parseCommand';
// import deploySlashCommands from './deploySlashCommands';

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
    parse: ['users', 'roles'],
    repliedUser: true,
  },
  intents: Object.values(Intents.FLAGS).filter(
    (flag) => !UNWANTED_INTENTS.includes(flag)
  ),
}) as Bot;

client.ownerId = env.get('OWNER_ID').required().asString();
client.commands = new Collection<string, ParsedBotCommand>();
client.commandInits = [];
client.servers = {};

// Gather commands
const commandFiles = fs
  .readdirSync('./build/commands')
  .filter((file: string) => file.endsWith('.js'));

for (const fileName of commandFiles) {
  const command = (await import(`./build/commands/${fileName}`)) as BotCommand;
  const commandName = fileName.replace('.js', '');
  const parsedCommand = parseCommand(command, commandName);
  client.commands.set(commandName, parsedCommand);
  if (parsedCommand.init) client.commandInits.push(parsedCommand.init);
  parsedCommand.aliases?.forEach((alias) => {
    if (client.commands.has(alias)) {
      logger.error(`Command alias ${alias} is double assigned!`);
      return;
    }
    client.commands.set(alias, parsedCommand);
  });
}

const eventFiles = fs
  .readdirSync('./build/events')
  .filter((file: string) => file.endsWith('.js'));

for (const fileName of eventFiles) {
  const event = (await import(`./build/events/${fileName}`)) as BotEvent<any>;
  if (event.once) {
    client.once(event.eventName, (...args) =>
      event.processEvent(client, ...args)
    );
  } else {
    client.on(event.eventName, (...args) => {
      try {
        event.processEvent(client, ...args);
      } catch (e) {
        const error = e as Error;
        logger.error(
          `Error processing event ${event.eventName}. ${error.name}: ${
            error.message
          }\n${error.stack || 'no stack trace'}`
        );
      }
    });
  }
}

client.login(env.get('DISCORD_TOKEN').required().asString());
// deploySlashCommands(); not yet
