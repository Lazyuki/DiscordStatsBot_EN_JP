import { BotCommand } from '@/types';
import {
  getServerActivity,
  getServerVoiceActivity,
} from '@database/statements';
import { showActivity } from '@utils/activity';

const command: BotCommand = {
  name: 'serverActivity',
  aliases: ['sac'],
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
  description: 'Server activity for the past 30 days',
  examples: ['sac', 'sac -n', 'sac -v'],
  normalCommand: async ({ message, server, options }) => {
    const showNumbers = Boolean(options['number']);
    const messageOnly = Boolean(options['messageOnly']);
    const voiceOnly = Boolean(options['voiceOnly']);

    const messageActivity = voiceOnly
      ? []
      : getServerActivity({
          guildId: server.guild.id,
        });
    const voiceActivity = messageOnly
      ? []
      : getServerVoiceActivity({
          guildId: server.guild.id,
        });

    await showActivity({
      message,
      title: `Server Activity`,
      showNumbers,
      messageOnly,
      voiceOnly,
      messageActivity,
      voiceActivity,
      voiceHourMultiplier: 20,
    });
  },
};

export default command;
