import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { DAY_IN_MILLIS } from '@utils/datetime';
import { successEmbed } from '@utils/embed';
import { REGEX_RAW_ID } from '@utils/regex';

const prune: BotCommand = {
  name: 'prune',
  isAllowed: ['SERVER_MODERATOR'],
  requiredBotPermissions: ['MANAGE_MESSAGES'],
  description:
    'Deletes messages sent by specified users in the channel in the past 24 hours. Use their IDs. Useful if you forget to delete messages when banning users.',
  arguments: '<user ID> [user2 ID...]',
  examples: ['prune 123454323454 2345432345643 4543246543234'],
  normalCommand: async ({ content, message }) => {
    const ids = content.match(REGEX_RAW_ID);
    if (!ids) {
      throw new CommandArgumentError('Please specify user IDs');
    }
    const now = new Date().getTime();

    let lastMessageID = message.id;
    let done = false;
    let count = 0;
    let totalDeleteCount = 0;
    await message.channel.sendTyping();
    while (!done) {
      const messages = await message.channel.messages.fetch({
        limit: 100,
        before: lastMessageID,
      });
      const deletingMessages = [];
      let num = 0;
      for (const message of messages.values()) {
        count++;
        if (++num === 100) {
          if (now - message.createdAt.getTime() > DAY_IN_MILLIS) {
            done = true;
            break;
          } else {
            lastMessageID = message.id;
          }
        }
        if (ids.includes(message.author.id)) {
          totalDeleteCount++;
          deletingMessages.push(message);
        }
      }
      if (deletingMessages.length > 0) {
        await message.channel.bulkDelete(deletingMessages);
      }
    }
    await message.channel.send(
      successEmbed(
        `Checked ${count} messages and deleted ${totalDeleteCount} messages!`
      )
    );
  },
};

export default prune;
