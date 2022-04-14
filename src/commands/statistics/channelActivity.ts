import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import {
  getChannelActivity,
  getServerActivity,
  getServerVoiceActivity,
} from '@database/statements';
import { showActivity } from '@utils/activity';
import { parseChannels } from '@utils/argumentParsers';
import { getMessageTextChannel } from '@utils/guildUtils';

const command: BotCommand = {
  name: 'channelActivity',
  aliases: ['cac'],
  requiredServerConfigs: ['statistics'],
  arguments: '[#channel]',
  options: [
    {
      name: 'number',
      short: 'n',
      description: 'Show actual numbers instead of bars',
      bool: true,
    },
  ],
  description: 'Channel activity for the past 30 days',
  examples: ['cac', 'cac -n', 'cac #bot'],
  normalCommand: async ({ message, server, options, content }) => {
    const showNumbers = Boolean(options['number']);
    const { channels } = parseChannels(content, server.guild);
    if (channels.length === 0) {
      const parentChannel = getMessageTextChannel(message);
      if (content || !parentChannel) {
        throw new CommandArgumentError('Please specify a valid text channel');
      }
      channels.push(parentChannel);
    }

    const messageActivity = getChannelActivity(
      {
        guildId: server.guild.id,
      },
      channels.map((c) => c.id)
    );

    await showActivity({
      message,
      title: `Channel Activity for ${channels
        .map((c) => `#${c.name}`)
        .join(', ')}`,
      showNumbers,
      messageOnly: true,
      voiceOnly: false,
      messageActivity,
      voiceActivity: [],
    });
  },
};

export default command;
