import { BotCommand } from '@/types';
import { errorEmbed, makeEmbed } from '@utils/embed';
import { EmbedField } from 'discord.js';

const command: BotCommand = {
  description: 'Recursion much?',
  normalCommand: async ({ message, bot, commandContent, server }) => {
    const commandName = commandContent.trim().toLowerCase();
    if (commandName) {
      const command = bot.commands[commandName];
      if (!command) {
        await message.channel.send(
          errorEmbed(
            `Command \`${commandName}\` does not exit.\nType \`${server.config.prefix}help\` to see the list of available commands.`
          )
        );
        return;
      } else if (!command.normalCommand) {
        await message.channel.send(
          errorEmbed(
            `Command \`${commandName}\` is for slash commands.\nType \`${server.config.prefix}help\` to see the list of available commands.`
          )
        );
        return;
      } else {
        const title = command.name;
        const description = command.description;
        const footer = command.aliases
          ? `Alias${
              command.aliases.length === 1 ? '' : 'es'
            }: ${command.aliases.join(', ')}`
          : undefined;
        const args = command.arguments
          ? { name: 'Arguments', value: command.arguments, inline: false }
          : null;
        const examples = command.examples
          ? {
              name: 'Examples',
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
          footer: `To see more details, type "${server.config.prefix}help commandName"`,
        })
      );
    }
  },
};

export default command;
