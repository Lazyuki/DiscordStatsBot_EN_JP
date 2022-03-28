import { version } from 'discord.js';
import { stripIndent } from 'common-tags';

import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';
import { millisToDuration } from '@utils/datetime';
import { getDatabaseFileSize } from '@database/statements';

const command: BotCommand = {
  name: 'info',
  description: 'Information about this bot',
  normalCommand: async ({ message, bot }) => {
    await message.channel.send(
      makeEmbed({
        title: `${bot.user?.username || 'Bot'} Information`,
        description: stripIndent`
          **Bot Owner**: <@${bot.ownerId}>
          **Uptime**: ${millisToDuration(bot.uptime)}
          **Number of Servers**: ${bot.guilds.cache.size}
          **Number of Cached Users**: ${bot.users.cache.size}

          ==== Technical =====
          **Discord.js Version**: ${version}
          **Node Version**: ${process.versions['node']}
          **Database Size**: ${getDatabaseFileSize() || 'Unknown'}
          `,
      })
    );
  },
};

export default command;
