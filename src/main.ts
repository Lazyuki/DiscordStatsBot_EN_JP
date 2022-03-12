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
const DEBUG_MODE = env.get('DEBUG').default('true').asBool();

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
client.commands = {};
client.commandInits = [];
client.botInits = [];
client.botExits = [];
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
    let commands = (await import(`./commands/${dir}/${fileName}`)).default as
      | BotCommand
      | BotCommand[];
    if (!Array.isArray(commands)) {
      commands = [commands];
    }
    commands.forEach((command) => {
      const parsedCommand = parseCommand(command, dir);
      const commandName = parseCommand.name;
      client.commands[commandName] = parsedCommand;
      if (parsedCommand.onCommandInit)
        client.commandInits.push(parsedCommand.onCommandInit);
      parsedCommand.aliases?.forEach((alias) => {
        if (client.commands[alias]) {
          logger.error(`Command alias ${alias} is double assigned!`);
          return;
        }
        client.commands[alias] = parsedCommand;
      });
      console.log('command registered', commandName);
    });
  }
}

const eventFiles = fs
  .readdirSync('./build/events')
  .filter((file: string) => file.endsWith('.js'));

for (const fileName of eventFiles) {
  let events = (await import(`./events/${fileName}`)).default as
    | BotEvent<any>
    | BotEvent<any>[];
  if (!Array.isArray(events)) {
    events = [events];
  }

  events.forEach((event) => {
    console.log('event registered', event);
    if (event.once) {
      client.once(event.eventName, async (...args) => {
        await event.processEvent(client, ...args);
      });
    } else {
      client.on(event.eventName, async (...args) => {
        if (DEBUG_MODE && event.skipOnDebug) return;
        try {
          await event.processEvent(client, ...args);
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
  });
}

process.on('unhandledRejection', console.error); // Show stack trace on unhandled rejection.

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received.');
  process.exit(0);
});

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
