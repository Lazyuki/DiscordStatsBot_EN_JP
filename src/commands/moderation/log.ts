import { BotCommand } from '@/types';

const command: BotCommand = {
  name: 'log',
  isAllowed: 'SERVER_MODERATOR',
  description: 'Warn people silently. Same as `{PREFIX}warn -s`',
  arguments: '<@user> [@user2...] [reason]',
  examples: [
    'log @Geralt being too good at Japanese',
    'log 284840842026549259 299335689558949888 shut up',
  ],
  normalCommand: async ({ bot, ...rest }) => {
    const warnCommand = bot.commands['warn'];
    await warnCommand.normalCommand?.({
      bot,
      ...rest,
      options: { silent: true },
    });
  },
};

export default command;
