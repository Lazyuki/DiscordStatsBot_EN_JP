import { stripIndent } from 'common-tags';

import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';
import { millisToDuration } from '@utils/datetime';
import pkg from '../../../package.json';
import { getDatabaseFileSize } from '@database/statements';

const command: BotCommand = {
  name: 'info',
  description: 'Information about this bot',
  normalCommand: async ({ message, bot }) => {
    await message.channel.send(
      makeEmbed({
        title: 'Ciri',
        description: stripIndent`
          **Bot Owner**: <@${bot.ownerId}>
          **Uptime**: ${millisToDuration(bot.uptime)}
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
          **Database Size**: ${getDatabaseFileSize() || 'Unknown'}
          `,
      })
    );
    await message.delete();
  },
};

export default command;
