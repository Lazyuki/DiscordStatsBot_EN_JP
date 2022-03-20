import { BotCommand } from '@/types';

const sar: BotCommand = {
  name: 'selfroles',
  aliases: ['sar'],
  isAllowed: 'ADMIN',
  description: 'Configure reaction based self assignable roles.',
  arguments: '',
  childCommands: ['lsar', 'esar', 'asar', 'dsar', 'csar'],
  examples: [],
  normalCommand: async ({ content, bot, ...rest }) => {},
};

export default sar;
