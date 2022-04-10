import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import { DISCORD_TOKEN, APPLICATION_ID } from '@/envs';
import logger from '@/logger';
import { EJLX } from '@utils/constants';
import { AppCommandBuilder } from '@/types';

async function deployApplicationCommands(slashBuilders: AppCommandBuilder[]) {
  const slashCommands: any[] = [];

  for (const builder of slashBuilders) {
    slashCommands.push(builder.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, EJLX), {
      body: slashCommands,
    });
    logger.info('Successfully registered application commands.');
  } catch (e) {
    logger.error(e);
  }
}

export default deployApplicationCommands;
