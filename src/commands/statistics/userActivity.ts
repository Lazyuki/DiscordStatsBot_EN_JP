import { BotCommand } from '@/types';
import { getUserActivity, getUserVoiceActivity } from '@database/statements';
import { showActivity } from '@utils/activity';
import { getUserId } from '@utils/argumentParsers';

import { idToUser } from '@utils/guildUtils';

const command: BotCommand = {
  name: 'activity',
  aliases: ['ac'],
  requiredServerConfigs: ['statistics'],
  arguments: '[user (default: command invoker)]',
  options: [
    {
      name: 'number',
      short: 'n',
      description: 'Show actual numbers instead of bars',
      bool: true,
    },
    {
      name: 'messageOnly',
      short: 'm',
      description: 'Only show message activity',
      bool: true,
    },
    {
      name: 'voiceOnly',
      short: 'v',
      description: 'Only show voice activity',
      bool: true,
    },
  ],
  description: 'User activity for the past 30 days',
  examples: ['ac', 'ac -n', 'ac @geralt', 'ac -v'],
  normalCommand: async ({ message, bot, server, options, content }) => {
    const showNumbers = Boolean(options['number']);
    const messageOnly = Boolean(options['messageOnly']);
    const voiceOnly = Boolean(options['voiceOnly']);

    const userId = getUserId(bot, server, content) || message.author.id;
    const messageActivity = voiceOnly
      ? []
      : getUserActivity({
          guildId: server.guild.id,
          userId,
        });
    const voiceActivity = messageOnly
      ? []
      : getUserVoiceActivity({
          guildId: server.guild.id,
          userId,
        });

    const userStr =
      server.guild.members.cache.get(userId)?.displayName || idToUser(userId);

    await showActivity({
      message,
      title: `User activity for ${userStr}`,
      showNumbers,
      messageOnly,
      voiceOnly,
      messageActivity,
      voiceActivity,
    });
  },
};

export default command;
