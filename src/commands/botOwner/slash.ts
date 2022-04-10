import exitTask from '@tasks/exitTask';
import { BotCommand } from '@/types';
import { cleanEmbed } from '@utils/embed';
import deploySlashCommands from '@utils/deploySlashCommands';
import { EJLX } from '@utils/constants';

const command: BotCommand = {
  name: 'slash',
  isAllowed: ['BOT_OWNER'],
  description: 'Deploy slash commands',
  normalCommand: async ({ bot, message }) => {},
};

export default command;
