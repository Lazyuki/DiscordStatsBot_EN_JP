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
  normalCommand: async ({ message, server, options }) => {
    const isGlobal = Boolean(options['global']);
    const commands = isGlobal
      ? getGlobalCommandLeaderboard()
      : getCommandLeaderboard({
          guildId: server.guild.id,
        });

    const fields = commands.map(({ command, count }, index) => {
      return {
        name: `${index + 1}) ${command}`,
        value: `${count}`,
      };
    });
    const title = isGlobal
      ? 'Global Command Leaderboard'
      : 'Server Command Leaderboard';
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
