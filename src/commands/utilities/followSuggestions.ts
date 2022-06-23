import { BotCommand } from '@/types';
import { EJLX, SUGGESTIONS_FORUM } from '@utils/constants';
import { makeEmbed, successEmbed } from '@utils/embed';
import { safeDelete } from '@utils/safeDelete';

const command: BotCommand = {
  name: 'followSuggestions',
  aliases: ['fs', 'suggestions'],
  allowedServers: [EJLX],
  isAllowed: ['WP'],
  description: `Automatically follow whenever a thread is created in <#${SUGGESTIONS_FORUM}>.`,
  normalCommand: async ({ server, message }) => {
    const followers = server.data.forumFollowers[SUGGESTIONS_FORUM];
    const authorId = message.author.id;
    const index = followers.findIndex((id) => id === authorId);
    if (index === -1) {
      followers.push(authorId);
      await message.channel.send(
        successEmbed('You are now **following** the server suggestions forum')
      );
    } else {
      followers.splice(index, 1);
      await message.channel.send(
        successEmbed('You have **unfollowed** the server suggestions forum')
      );
    }
  },
};

export default command;
