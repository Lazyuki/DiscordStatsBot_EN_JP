import { stripIndent } from 'common-tags';

import { BotCommand } from '@/types';
import { makeEmbed } from '@utils/embed';
import { millisToDuration } from '@utils/datetime';

const command: BotCommand = {
  name: 'user',
  description: 'Show user statistics',
  aliases: ['u'],
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot }) => {},
};

export default command;
