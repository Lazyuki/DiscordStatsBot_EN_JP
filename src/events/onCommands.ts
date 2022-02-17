import { BotEvent, SafeMessage } from '@/types';
import logger from '@/logger';
import { BotError, NotFoundError, UserError } from '@/errors';
import { EJLX } from '@utils/constants';
import { DiscordAPIError } from '@discordjs/rest';
import { errorEmbed } from '@utils/embed';
import { Message, MessageOptions, Util } from 'discord.js';
import safeSend from '@utils/safeSend';
import { isNotDM } from '@utils/typeGuards';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  once: false,
  processEvent: async (bot, message) => {
    if (!isNotDM(message)) return; // DM
    if (message.author.bot || message.system) return;
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
      // Check permission
      if (command.isAllowed(message, server, bot) && command.normalCommand) {
        const sendChannel = message.channel.send.bind(message.channel);
        const replyMessage = message.reply.bind(message);
        const safeChannelSend = safeSend(sendChannel);
        const safeReply = safeSend(replyMessage);

        try {
          await command.normalCommand({
            commandContent,
            message,
            bot,
            server,
            prefix: server.config.prefix,
            send: safeChannelSend,
            reply: safeReply,
          });
        } catch (e) {
          const error = e as Error | DiscordAPIError | UserError | BotError;
          if (error instanceof DiscordAPIError) {
            if (error.code === 401) {
              await safeChannelSend(
                errorEmbed(
                  `${error.name}: ${error.message}\nMake sure the bot has required permissions`
                )
              );
            } else {
              await safeChannelSend(
                errorEmbed(`${error.name}: ${error.message}`)
              );
            }
            logger.warn(`${error.code} ${error.name}: ${error.message}`);
          } else if (error instanceof UserError) {
            await safeChannelSend(
              errorEmbed(`${error.name}: ${error.message}`)
            );
            switch (error) {
            }
          } else if (error instanceof BotError) {
            await safeChannelSend(
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
            await safeChannelSend(
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
