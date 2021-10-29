import { BotEvent } from '../types';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  once: false,
  processEvent: async (bot, message) => {
    if (message.channel.type === 'DM') {
      // Direct message.
      // Check EJLX user
      const ejlxMember = bot.servers[
        '189571157446492161'
      ].guild.members.cache.get(message.author.id);
      if (ejlxMember) {
        // Check for stage role
        return;
      }
    }
  },
};

export default event;
