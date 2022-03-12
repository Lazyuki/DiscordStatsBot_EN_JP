import { stripIndents } from 'common-tags';
import { formatDuration, intervalToDuration } from 'date-fns';

import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';
import pkg from '../../../package.json';

const command: BotCommand = {
  name: 'info',
  description: 'Information about this bot',
  normalCommand: async ({ message, bot }) => {
    await message.channel.send(
      makeEmbed({
        title: 'Ciri',
        description: stripIndents`
          **Uptime**: ${formatDuration(
            intervalToDuration({ start: 0, end: bot.uptime || 0 })
          )}
          **Number of Servers**: ${bot.guilds.cache.size}
          ==== Technical =====
          **Node Version**: ${process.versions['node']}
          **Typescript Version**: ${pkg.dependencies['typescript'].replace(
            '^',
            ''
          )}
          **Discord.js Version**: ${pkg.dependencies['discord.js'].replace(
            '^',
            ''
          )}
          `,
      })
    );
    await message.delete();
  },
};

export default command;
