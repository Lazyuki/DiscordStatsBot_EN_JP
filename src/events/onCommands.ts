import { escapeCodeBlock, escapeInlineCode, DiscordAPIError } from 'discord.js';
import { BotEvent } from '@/types';
import logger, { discordLogError } from '@/logger';
import {
  BotError,
  NotFoundError,
  UserError,
  MemberNotFoundError,
  CommandArgumentError,
} from '@/errors';
import { errorEmbed } from '@utils/embed';
import safeSend from '@utils/safeSend';
import { isNotDM } from '@utils/guildUtils';
import isRateLimited from '@utils/rateLimit';
import { optionParser } from '@utils/optionParser';
import { userToTagAndId } from '@utils/formatString';
import { insertCommands } from '@database/statements';
import { deleteAfter } from '@utils/safeDelete';
import { EJLX } from '@utils/constants';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: false,
  processEvent: async (bot, message) => {
    if (!isNotDM(message)) return; // DM
    if (message.author.bot || message.system) return;

    let server = bot.servers[message.guild.id];
    const match = message.content.match(/^!!([0-9]+|ejlx)/);
    if (match && message.author.id === bot.ownerId) {
      const serverId = match[1];
      if (serverId === 'ejlx') {
        server = bot.servers[EJLX];
      } else {
        server = bot.servers[serverId];
      }
      if (!server) {
        throw new NotFoundError(`Server with ID: \`${serverId}\` not found.`);
      }
      message.content = message.content.replace(/^!!([0-9]+|ejlx)/, '');
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
          for (const permission of command.requiredBotPermissions) {
            if (!message.guild.members.me?.permissions.has(permission)) {
              // see if I have the guild wide permission
              if (
                !message.channel
                  .permissionsFor(message.guild.members.me!.id)
                  ?.has(permission)
              ) {
                // check channel-specific permissions
                await message.channel.send(
                  errorEmbed(
                    `Missing Bot Permission: \`${permission}\`.\nContact server moderators to configure my permissions.`
                  )
                );
                return;
              }
            }
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
        insertCommands({
          guildId: message.guild.id,
          userId: message.author.id,
          date: bot.utcDay,
          command: command.name,
          commandCount: 1,
        });

        // ignore cirilla command
        if (command.isCirillaCommand) return;

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
            if (error.status === 401) {
              await safeChannelSend(
                errorEmbed(
                  `${error.name}: ${error.message}\nMake sure the bot has required permissions`
                )
              );
            } else {
              await safeChannelSend(
                errorEmbed(`${error.name}: ${error.message}`)
              );
              await discordLogError(
                bot,
                error,
                `Command: \`${command.name}\` by ${userToTagAndId(
                  message.author
                )} in #${message.channel.name} in \`${message.guild.name}\` (${
                  message.guildId
                }). Content: \`${escapeCodeBlock(message.content)}\``
              );
            }
            logger.warn(`${error.status} ${error.name}: ${error.message}`);
          } else if (error instanceof UserError) {
            if (error instanceof MemberNotFoundError) {
              if (error.message) {
                deleteAfter(
                  await safeChannelSend(
                    errorEmbed(
                      `Member not found in the server: \`${escapeInlineCode(
                        error.message
                      )}\``
                    )
                  ),
                  20
                );
              } else {
                await message.react('❓');
              }
            } else if (error instanceof CommandArgumentError) {
              deleteAfter(await safeChannelSend(errorEmbed(error.message)), 30);
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
            await discordLogError(
              bot,
              error,
              `Command: \`${command.name}\` by ${userToTagAndId(
                message.author
              )} in #${message.channel.name} in \`${message.guild.name}\` (${
                message.guildId
              }). Content: \`${escapeCodeBlock(message.content)}\``
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
            await discordLogError(
              bot,
              error,
              `Unexpected Error Command: \`${
                command.name
              }\` by ${userToTagAndId(message.author)} in #${
                message.channel.name
              } in \`${message.guild.name}\` (${
                message.guildId
              }). Content: \`${escapeCodeBlock(message.content)}\``
            );
          }
        }
        return;
      }
    }
  },
};

export default event;
