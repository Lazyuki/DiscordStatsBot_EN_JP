import 'source-map-support/register';
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';

import { DEBUG, OWNER_ID, DISCORD_TOKEN } from '@/envs';
import logger, { discordLogError } from '@/logger';
import {
  Bot,
  BotCommand,
  BotConfig,
  BotEvent,
  ParsedBotCommand,
} from '@/types';
import parseCommand from '@utils/parseCommand';
import initialTask from '@tasks/initialTask';
import exitTask from '@tasks/exitTask';

// Set up intents
const UNWANTED_INTENTS = [
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.GuildMessageTyping,
  GatewayIntentBits.DirectMessageTyping,
];

const intents = Object.values(GatewayIntentBits).filter(
  (flag) => typeof flag !== 'string' && !UNWANTED_INTENTS.includes(flag)
) as GatewayIntentBits[];

console.log(intents);
// Init bot user
const client = new Client({
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true,
  },
  intents,
}) as Bot;

client.ownerId = OWNER_ID;
client.commands = {};
client.commandInits = [];
client.serverInits = [];
client.botInits = [];
client.botExits = [];
client.serverConfigInits = [];
client.servers = {};
client.applicationCommands = [];
client.config = {} as BotConfig;

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
      const commandName = parsedCommand.name.toLowerCase();
      client.commands[commandName] = parsedCommand;
      if (parsedCommand.onCommandInit) {
        client.commandInits.push(parsedCommand.onCommandInit);
      }
      if (parsedCommand.onBotInit) {
        client.botInits.push(parsedCommand.onBotInit);
      }
      if (parsedCommand.onBotExit) {
        client.botExits.push(parsedCommand.onBotExit);
      }
      if (parsedCommand.applicationCommand) {
        client.applicationCommands.push(parsedCommand.applicationCommand);
      }
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

const cirillaCommands = (await import(`./cirillaCommands`))
  .default as ParsedBotCommand[];

for (const cirillaCommand of cirillaCommands) {
  client.commands[cirillaCommand.name] = cirillaCommand;
  cirillaCommand.aliases?.forEach((alias) => {
    client.commands[alias] = cirillaCommand;
  });
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
    if (event.onServerInit) {
      client.serverInits.push(event.onServerInit);
    }
    if (event.onBotInit) {
      client.botInits.push(event.onBotInit);
    }
    if (event.onBotExit) {
      client.botExits.push(event.onBotExit);
    }
    if (event.once) {
      client.once(event.eventName, async (...args) => {
        await event.processEvent(client, ...args);
      });
    } else {
      client.on(event.eventName, async (...args) => {
        if (DEBUG && event.skipOnDebug) return;
        try {
          await event.processEvent(client, ...args);
        } catch (e) {
          const error = e as Error;
          logger.error(
            `Error processing event ${event.eventName} in ${fileName}. ${
              error.name
            }: ${error.message}\n${error.stack || 'no stack trace'}`
          );
          discordLogError(
            client,
            error,
            `Error processing event ${
              event.eventName
            } in ${fileName}. Args: (${args
              .map(
                (a: any) =>
                  `${a?.constructor?.name} with ID:${a?.id || 'None'} Guild:${
                    a?.guild?.name || 'None'
                  } Channel:${a?.channel?.name || 'None'}`
              )
              .join(', ')})`
          );
        }
      });
    }
  });
}

process.on('uncaughtExceptionMonitor', (error, origin) => {
  logger.error(`UNCAUGHT EXCEPTION at ${origin}`);
  logger.error(error);
  discordLogError(client, error, `UNCAUGHT EXCEPTION at ${origin}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`UNHANDLED PROMISE REJECTION at ${promise}`);
  logger.error(reason);
  try {
    throw reason;
  } catch (e) {
    discordLogError(client, e as Error, 'UNHANDLED PROMISE REJECTION');
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received.');
  exitTask(client);
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received.');
  exitTask(client);
  process.exit(0);
});

initialTask(client);

client.login(DISCORD_TOKEN);
