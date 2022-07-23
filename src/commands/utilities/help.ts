import { BotCommand } from '@/types';
import { CIRILLA } from '@utils/constants';
import { errorEmbed, makeEmbed } from '@utils/embed';
import { code } from '@utils/formatString';
import { isMessageInChannels } from '@utils/guildUtils';
import { pluralize } from '@utils/pluralize';
import { EmbedField } from 'discord.js';

const command: BotCommand = {
  name: 'help',
  aliases: ['h'],
  description: 'You need help with help?',
  normalCommand: async ({ message, bot, content, server }) => {
    const commandName = content.trim().toLowerCase();
    const isInHiddenChannel = isMessageInChannels(
      message,
      server.config.hiddenChannels
    );
    const cirillaExists = server.guild.members.cache.has(CIRILLA);

    if (commandName === 'command') {
      await message.channel.send(
        errorEmbed({
          description: `When I said \`Type "${server.config.prefix}help command"\`, you were supposed to swap \`command\` with an actual command in the list.`,
        })
      );
      return;
    }
    if (commandName) {
      const command = bot.commands[commandName];
      if (!command || (command.isCirillaCommand && !cirillaExists)) {
        await message.channel.send(
          errorEmbed({
            description: `Command \`${commandName}\` does not exit.`,
            footer: `Type "${server.config.prefix}help" to see the list of available commands.`,
          })
        );
        return;
      } else if (!command.normalCommand) {
        await message.channel.send(
          errorEmbed({
            description: `Command \`${commandName}\` is for slash commands.`,
            footer: `Type "${server.config.prefix}help" to see the list of available commands.`,
          })
        );
        return;
      } else {
        const isAllowed =
          command.isAllowed(message, server, bot) && command.normalCommand;
        if (!isAllowed) return; // Don't even show an error message

        const missingBotPermissions: string[] = [];
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
                missingBotPermissions.push(permission);
              }
            }
          }
        }
        const title = command.name;
        const description = command.description.replaceAll(
          '{PREFIX}',
          server.config.prefix
        );
        const footer = command.aliases
          ? `${pluralize(
              'Alias',
              'es',
              command.aliases.length
            )}: ${command.aliases.join(', ')}`
          : undefined;
        const options = command.options
          ? {
              name: pluralize('Option', 's', command.options.length),
              value: command.options
                .map(
                  (option) =>
                    `--**${option.name}**: \`-${
                      option.short
                    }\` ${option.description.replace(
                      '{PREFIX}',
                      server.config.prefix
                    )}`
                )
                .join('\n'),
              inline: false,
            }
          : null;
        const argArray = Array.isArray(command.arguments)
          ? command.arguments
          : command.arguments
          ? [command.arguments]
          : null;
        const args = argArray
          ? {
              name: 'Arguments',
              value: `\`< >\` means *required* and \`[ ]\` means *optional*\n\n${argArray
                .map(code)
                .join('\n')}`,
              inline: false,
            }
          : null;
        const examples = command.examples
          ? {
              name: pluralize('Example', 's', command.examples.length),
              value: command.examples
                .map((example) =>
                  Array.isArray(example)
                    ? `\`${server.config.prefix}${example[0]}\` ${example[1]}`
                    : `\`${server.config.prefix}${example}\``
                )
                .join('\n'),
              inline: false,
            }
          : null;

        const missingPerms = missingBotPermissions.length
          ? {
              name: pluralize(
                'Missing Bot Permission',
                's',
                missingBotPermissions.length
              ),
              value: `I'm missing ${pluralize(
                '',
                'these permissions',
                missingBotPermissions.length,
                'a permission'
              )} for this command to work. Please contact server admins to fix this.\n\n[${missingBotPermissions
                .map(code)
                .join(', ')}]`,
            }
          : null;
        await message.channel.send(
          makeEmbed({
            title,
            description,
            fields: [missingPerms, args, options, examples].filter(
              Boolean
            ) as EmbedField[],
            footer,
          })
        );
      }
    } else {
      const commandSet = new Set(Object.values(bot.commands));
      const allowedCommands: Record<string, string[]> = {};
      for (const command of commandSet) {
        if (
          command.normalCommand &&
          command.isAllowed(message, server, bot) &&
          !command.parentCommand &&
          (!command.hidden || isInHiddenChannel) &&
          (!command.isCirillaCommand || cirillaExists)
        ) {
          let name = command.name;
          if (command.childCommands?.length) {
            name += ', ' + command.childCommands.join(', ');
          }
          if (allowedCommands[command.category]) {
            allowedCommands[command.category].push(name);
          } else {
            allowedCommands[command.category] = [name];
          }
        }
      }
      const fields = Object.keys(allowedCommands).map((category) => ({
        name: category,
        value:
          '```markdown\n' +
          allowedCommands[category].map((c) => `- ${c}`).join('\n\n') +
          '```',
        inline: true,
      }));
      await message.channel.send(
        makeEmbed({
          fields,
          footer: `Type "${server.config.prefix}help command" for help with each command`,
        })
      );
    }
  },
};

export default command;
