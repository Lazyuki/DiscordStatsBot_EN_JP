import { Util, DiscordAPIError } from 'discord.js';
import { BotEvent } from '@/types';
import logger from '@/logger';
import {
  BotError,
  NotFoundError,
  UserError,
  MemberNotFoundError,
} from '@/errors';
import { EJLX } from '@utils/constants';
import { errorEmbed } from '@utils/embed';
import safeSend from '@utils/safeSend';
import { isNotDM } from '@utils/guildUtils';
import isRateLimited from '@utils/rateLimit';
import { optionParser } from '@utils/optionParser';
import { code } from '@utils/formatString';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!isNotDM(message)) return; // DM
    if (message.author.bot || message.system) return;

    let server = bot.servers[message.guild.id];
    const match = message.content.match(/^!!([0-9]+)/);
    if (match && message.author.id === bot.ownerId) {
      server = bot.servers[match[1]];
      if (!server) {
        throw new NotFoundError(`Server with ID: \`${match[1]}\` not found.`);
      }
      message.content = message.content.replace(/^!![0-9]+/, '');
    }

    // Is it not my command?
    if (!message.content.toLowerCase().startsWith(server.config.prefix)) {
      return;
    }
    // Separate the command and the content
    const commandName = message.content
      .split(' ')[0]
      .slice(server.config.prefix.length)
      .toLowerCase();
    let content = message.content
      .slice(server.config.prefix.length + commandName.length)
      .trim();
    const command = bot.commands[commandName];
    if (command) {
      // Check user permission
      if (command.isAllowed(message, server, bot) && command.normalCommand) {
        if (command.rateLimitSeconds) {
          if (
            isRateLimited(
              `${command.name}_${message.channelId}`,
              command.rateLimitSeconds
            )
          ) {
            // Being rate limited
            return;
          }
        }
        // Check bot permission
        if (command.requiredBotPermissions) {
          if (
            !command.requiredBotPermissions.every((p) =>
              message.channel.permissionsFor(message.guild.me!.id)?.has(p)
            )
          ) {
            await message.channel.send(
              errorEmbed(
                `Missing Bot Permissions: [${command.requiredBotPermissions
                  .map(code)
                  .join(
                    ', '
                  )}]. Contact server moderators to configure my permissions.`
              )
            );
            return;
          }
        }
        const sendChannel = message.channel.send.bind(message.channel);
        const replyMessage = message.reply.bind(message);
        const safeChannelSend = safeSend(sendChannel);
        const safeReply = safeSend(replyMessage);
        let options = {};
        if (command.options) {
          const { restContent, resolvedOptions } = optionParser(
            content,
            command.options
          );
          content = restContent.trim();
          options = resolvedOptions;
        }

        try {
          await command.normalCommand({
            content,
            message,
            bot,
            server,
            options,
            prefix: server.config.prefix,
            send: safeChannelSend,
            reply: safeReply,
          });
        } catch (e) {
          const error = e as Error | DiscordAPIError | UserError | BotError;
          if (error instanceof DiscordAPIError) {
            if (error.httpStatus === 401) {
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
            logger.warn(`${error.httpStatus} ${error.name}: ${error.message}`);
          } else if (error instanceof UserError) {
            if (error instanceof MemberNotFoundError) {
              if (error.message) {
                await safeChannelSend(
                  errorEmbed(
                    `Member not found in the server: \`${Util.escapeInlineCode(
                      error.message
                    )}\``
                  )
                );
              } else {
                await message.react('❓');
              }
            } else {
              await safeChannelSend(
                errorEmbed(`${error.name}: ${error.message}`)
              );
            }
          } else if (error instanceof BotError) {
            await safeChannelSend(
              errorEmbed(
                `There was an error with the bot.\n${error.name}: ${error.message}`
              )
            );
            logger.error(
              `${error.name}: ${error.message}\n${
                error.stack || 'no stack trace'
              }`
            );
          } else {
            await safeChannelSend(
              errorEmbed({
                content: `<@${bot.ownerId}> will look into this`,
                description: `Unexpected Error: ${error.name}\n${error.message}`,
              })
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
