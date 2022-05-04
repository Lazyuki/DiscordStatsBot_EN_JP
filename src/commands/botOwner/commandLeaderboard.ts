import { BotCommand } from '@/types';
import {
  getCommandLeaderboard,
  getGlobalCommandLeaderboard,
} from '@database/statements';
import { fieldsPaginator } from '@utils/paginate';
const command: BotCommand = {
  name: 'commandLeaderboard',
  aliases: ['cmlb', 'cml'],
  isAllowed: ['BOT_OWNER'],
  description: 'Show leaderboard for Ciri commands.',
  options: [
    {
      name: 'global',
      short: 'g',
      description: 'Show command usage across all servers',
      bool: true,
    },
  ],
  normalCommand: async ({ message, server, options, bot, content }) => {
    const guildId = content || server.guild.id;
    const isGlobal = Boolean(options['global']);
    const commands = isGlobal
      ? getGlobalCommandLeaderboard()
      : getCommandLeaderboard({
          guildId,
        });

    const fields = commands.map(({ command, count }, index) => {
      return {
        name: `${index + 1}) ${command}`,
        value: `${count}`,
      };
    });
    const title = isGlobal
      ? 'Global Command Leaderboard'
      : `Server Command Leaderboard for ${
          bot.servers[guildId]?.guild.name || guildId
        }`;
    await fieldsPaginator(
      message.channel,
      title,
      'Total command usage in the last 30 days',
      fields,
      true,
      -1,
      message.author.id
    );
  },
};

export default command;
