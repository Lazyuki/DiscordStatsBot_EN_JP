import { BotEvent } from '@/types';
import logger from '@/logger';
import { InteractionType } from 'discord.js';

const event: BotEvent<'interactionCreate'> = {
  eventName: 'interactionCreate',
  skipOnDebug: true,
  processEvent: async (bot, interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const command = bot.commands[interaction.commandName];

    if (!command || !command.replyInteraction) return;

    try {
      await command.replyInteraction(interaction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  },
};

export default event;
