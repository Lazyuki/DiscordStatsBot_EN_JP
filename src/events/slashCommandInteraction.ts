import { BotEvent } from 'types';
import logger from 'logger';

const event: BotEvent<'interactionCreate'> = {
  eventName: 'interactionCreate',
  once: false,
  processEvent: async (bot, interaction) => {
    logger.info(`Slash Command`);
    if (!interaction.isCommand()) return;

    const command = bot.commands.get(interaction.commandName);

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
