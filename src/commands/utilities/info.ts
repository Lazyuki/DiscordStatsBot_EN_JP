import { stripIndents } from 'common-tags';

import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';

const command: BotCommand = {
  description: 'Information about this bot',
  normalCommand: async ({ message, bot }) => {
    await message.channel.send(
      makeEmbed({
        title: 'Ciri',
        description: stripIndents`
          Number of Servers: ${bot.guilds.cache.size}
          Invite Link: 
          `,
      })
    );
    await message.delete();
  },
};

export default command;
