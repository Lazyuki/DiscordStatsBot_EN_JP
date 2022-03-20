import { BotCommand } from '@/types';
import { errorEmbed, makeEmbed } from '@utils/embed';
import pluralize from '@utils/pluralize';
import { EmbedField } from 'discord.js';

const command: BotCommand = {
  name: 'help',
  description: 'You need help with help?',
  normalCommand: async ({ message, bot, content, server }) => {
    const commandName = content.trim().toLowerCase();
    if (commandName === 'command') {
      await message.channel.send(
        errorEmbed({
          content: `When I said \`Type "${server.config.prefix}help command"\`, you were supposed to swap \`command\` with an actual command in the list.`,
        })
      );
      return;
    }
    if (commandName) {
      const command = bot.commands[commandName];
      if (!command) {
        await message.channel.send(
          errorEmbed({
            content: `Command \`${commandName}\` does not exit.`,
            footer: `Type "${server.config.prefix}help" to see the list of available commands.`,
          })
        );
        return;
      } else if (!command.normalCommand) {
        await message.channel.send(
          errorEmbed({
            content: `Command \`${commandName}\` is for slash commands.`,
            footer: `Type "${server.config.prefix}help" to see the list of available commands.`,
          })
        );
        return;
      } else {
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
                    `${option.name}: \`-${
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
        const args = command.arguments
          ? {
              name: pluralize('Argument', 's', command.arguments.length),
              value: command.arguments,
              inline: false,
            }
          : null;
        const examples = command.examples
          ? {
              name: pluralize('Example', 's', command.examples.length),
              value: command.examples
                .map((example) => `\`${server.config.prefix}${example}\``)
                .join('\n'),
              inline: false,
            }
          : null;
        await message.channel.send(
          makeEmbed({
            title,
            description,
            fields: [args, examples].filter(Boolean) as EmbedField[],
            footer,
          })
        );
      }
    } else {
      const commandSet = new Set(Object.values(bot.commands));
      const allowedCommands: Record<string, string[]> = {};
      for (const command of commandSet) {
        if (command.normalCommand && command.isAllowed(message, server, bot)) {
          if (allowedCommands[command.category]) {
            allowedCommands[command.category].push(command.name);
          } else {
            allowedCommands[command.category] = [command.name];
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
