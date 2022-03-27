import { BotCommand } from '@/types';

const command: BotCommand = {
  name: 'message',
  isAllowed: ['SERVER_MODERATOR', 'MAINICHI_COMMITTEE'],
  description:
    'Send a DM. It will be titled as "Message from SERVER_NAME". The message will **NOT** be logged in `warnlog`.',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'message @Geralt hello',
    'message 284840842026549259 299335689558949888 please be kind next time',
  ],
  normalCommand: async ({ bot, ...rest }) => {},
};

export default command;
