import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import env from 'env-var';

import logger from './logger';
import { BotCommand } from './types';
import { EJLX } from './utils/ejlxConstants';

async function deploySlashCommands() {
  const commands = [];
  const commandFiles = fs
    .readdirSync('./build/commands')
    .filter((file: string) => file.endsWith('.js'));

  for (const file of commandFiles) {
    // tslint:disable-next-line:no-var-requires
    const command = require(`./commands/${file}`) as BotCommand;
    if (!command.slashCommand) continue;
    commands.push(command.slashCommand.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(
    env.get('DISCORD_TOKEN').required().asString()
  );

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        env.get('CLIENT_ID').required().asString(),
        EJLX
      ),
      {
        body: commands,
      }
    );
    logger.info('Successfully registered application commands.');
  } catch (e) {
    logger.error(e);
  }
}

export default deploySlashCommands;
