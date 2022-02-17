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

// When set to true, event handlers that send messages automatically will not fire
const DEBUG_MODE = env.get('DEBUG').default('false').asBool();

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
const dirs = fs
  .readdirSync('./build/commands')
  .filter((file) => !file.includes('.js'));

for (const dir of dirs) {
  const commandFiles = fs
    .readdirSync(`./build/commands/${dir}`)
    .filter((file) => file.endsWith('.js'));
  for (const fileName of commandFiles) {
    const command = (await import(`./commands/${dir}/${fileName}`))
      .default as BotCommand;
    const commandName = fileName.replace('.js', '');

    console.log('command registered', commandName);
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
}

const eventFiles = fs
  .readdirSync('./build/events')
  .filter((file: string) => file.endsWith('.js'));

for (const fileName of eventFiles) {
  const event = (await import(`./events/${fileName}`)).default as BotEvent<any>;
  console.log('event registered', event);
  if (event.once) {
    client.once(event.eventName, (...args) =>
      event.processEvent(client, ...args)
    );
  } else {
    client.on(event.eventName, (...args) => {
      if (DEBUG_MODE && event.skipOnDebug) return;
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

process.on('unhandledRejection', console.error); // Show stack trace on unhandled rejection.

// setInterval(() => {
//   // Set up hourly backup state task
//   savingTask(client);
// }, 60 * 60 * 1000);
// const time = new Date();
// let h = time.getUTCHours();
// let m = time.getUTCMinutes();
// let s = time.getUTCSeconds();
// let timeLeft = 24 * 60 * 60 - h * 60 * 60 - m * 60 - s;
// setTimeout(() => {
//   // Set up the day changing task
//   midnightTask(bot);
// }, timeLeft * 1000); // Time left until the next day

client.login(env.get('DISCORD_TOKEN').required().asString());
// if (!DEBUG_MODE) deploySlashCommands();
