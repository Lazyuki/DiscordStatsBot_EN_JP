import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { EJLX, SPORTS_FORUM } from '@utils/constants';
import { successEmbed } from '@utils/embed';
import { ForumChannel, ThreadAutoArchiveDuration } from 'discord.js';

const command: BotCommand = {
  name: 'sportsForum',
  aliases: ['sports'],
  allowedServers: [EJLX],
  isAllowed: ['SERVER_MODERATOR'],
  description:
    'Add a new sports thread in the sports forum. The first name in the slash separated arguments will be used as the title',
  arguments: '<Sports Name>[/alias1/alias2...]',
  examples: ['sports Soccer/Football/サッカー', 'sports Table Tennis/卓球'],
  normalCommand: async ({ content, message, server }) => {
    const names = content.split('/').map((name) => name.trim());
    const title = names[0];
    if (!title) {
      throw new CommandArgumentError('Please specify sports');
    }
    const sportsForum = server.guild.channels.cache.get(
      SPORTS_FORUM
    ) as ForumChannel;
    const thread = await sportsForum.threads.create({
      name: title,
      message: {
        content: `Talk about ${content}`,
      },
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
    await message.channel.send(successEmbed(`Successfully created ${thread}`));
  },
};

export default command;
