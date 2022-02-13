import { BotEvent, SafeMessage } from 'types';
import logger from 'logger';
import { BotError, NotFoundError, UserError } from 'errors';
import { EJLX } from 'utils/constants';
import { DiscordAPIError } from '@discordjs/rest';
import { errorEmbed } from 'utils/embed';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  once: false,
  processEvent: async (bot, message) => {
    if (message.channel.type === 'DM') return;
    if (message.author.bot || message.system) return;
    if (!message.guild) return;
    if (!message.member) {
      // Author's member instance is not cached???
      logger.warn(
        `Member is null for guild:${message.guild.id} message:${message.content}`
      );
      return;
    }

    let server = bot.servers[message.guild.id];
    let serverOverride = false;
    const match = message.content.match(/^!!(\d+)/);
    if (match && message.author.id === bot.ownerId) {
      server = bot.servers[match[1]];
      if (!server) {
        throw new NotFoundError(`Server with ID: ${match[1]} not found.`);
      }
      message.content = message.content.replace(/^!!\d+/, '');
      serverOverride = true;
    }

    // Is it not a command?
    if (!message.content.toLocaleLowerCase().startsWith(server.config.prefix)) {
      return;
    }
    // Separate the command and the content
    const commandName = message.content
      .split(' ')[0]
      .slice(server.config.prefix.length)
      .toLowerCase();
    const commandContent = message.content
      .slice(server.config.prefix.length + commandName.length)
      .trim();
    const command = bot.commands.get(commandName);
    if (command) {
      // if Ciri's command
      if (command.isAllowed(message, server, bot) && command.normalCommand) {
        // Check permission
        try {
          await command.normalCommand({
            commandContent,
            message: message as SafeMessage,
            bot,
            server,
            prefix: server.config.prefix,
          });
        } catch (e) {
          const error = e as Error | DiscordAPIError | UserError | BotError;
          if (error instanceof DiscordAPIError) {
            await message.channel.send(`${error.name}: ${error.message}`);
            if (error.code === 401) {
              await message.channel.send(
                errorEmbed(
                  `${error.name}: ${error.message}\nMake sure the bot has required permissions`
                )
              );
            } else {
              await message.channel.send(
                errorEmbed(`${error.name}: ${error.message}`)
              );
            }
            logger.warn(`${error.code} ${error.name}: ${error.message}`);
          } else if (error instanceof UserError) {
            await message.channel.send(
              errorEmbed(`${error.name}: ${error.message}`)
            );
            switch (error) {
            }
          } else if (error instanceof BotError) {
            await message.channel.send(
              errorEmbed(
                `There was an unexpected error with the bot.\n${error.name}: ${error.message}`
              )
            );
            logger.error(
              `${error.name}: ${error.message}\n${
                error.stack || 'no stack trace'
              }`
            );
          } else {
            await message.channel.send(
              errorEmbed(
                `Unexpected Error: ${error.message}\n\n<@${bot.ownerId}> will look into this`
              )
            );
            logger.error(
              `${error.name}: ${error.message}\n${
                error.stack || 'no stack trace'
              }`
            );
          }
        }
        return;
      }
    }
  },
};

export default event;
