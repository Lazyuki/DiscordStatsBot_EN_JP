import { CommandArgumentError } from '@/errors';
import { BotCommand, NotifyType, RoleNotifyType } from '@/types';
import { parseMembers } from '@utils/argumentParsers';
import { saveConfig } from '@utils/disk';
import { infoEmbed, successEmbed } from '@utils/embed';

declare module '@/types' {
  interface BotConfig {
    lineNotify: Record<string, LineNotifyConfig>;
  }
}

const activeStaffConfig: RoleNotifyType[] = [
  'OFFLINE',
  'OFFLINE_NOROLE',
  'ALWAYS',
  'NEVER',
];
const mentinoConfig: NotifyType[] = ['OFFLINE', 'ALWAYS', 'NEVER'];

const command: BotCommand = {
  name: 'lineNotify',
  aliases: ['line'],
  isAllowed: ['BOT_OWNER'],
  description: 'Configure LINE Notify',
  options: [
    {
      name: 'activeStaff',
      short: 'a',
      description:
        "Be notified when Active Staff is pinged. `ALWAYS`: notify always. `OFFLINE`: notify when you are offline. `OFFLINE_NOROLE`: notify when offline or if you don't have the role. `NEVER`: never.",
      bool: false,
    },
    {
      name: 'mention',
      short: 'm',
      description:
        'Be notified when you are mentioned. `ALWAYS`: notify always. `OFFLINE`: notify when you are offline. `NEVER`: never notify.',
      bool: false,
    },
    {
      name: 'token',
      short: 't',
      description: 'LINE Notify token.',
      bool: false,
    },
    {
      name: 'delete',
      short: 'd',
      description: 'Delete LINE notification config for users',
      bool: true,
    },
  ],
  examples: [
    'line @Geralt -a OFFLINE_NOROLE -m OFFLINE -t fhdsafjkldsjfkl',
    'line @Geralt -a NEVER -m ALWAYS',
    'line @Geralt -d',
  ],
  onBotInit: (bot) => {
    bot.config.lineNotify ||= {};
  },
  normalCommand: async ({ bot, content, message, options, server }) => {
    const { allIds } = parseMembers(content, server.guild);
    if (allIds.length === 0) {
      const configs = Object.entries(bot.config.lineNotify);
      if (configs.length) {
        await message.channel.send(
          infoEmbed({
            title: 'LINE Notify Config',
            fields: configs.map((c) => {
              const [id, notify] = c;
              const user = bot.users.cache.get(id);
              const { lineNotifyToken, ...restNotify } = notify; // Don't show line notify token
              return {
                name: `<@${id}> (${user?.tag || 'Unknown'})`,
                value: JSON.stringify(restNotify, null, 2),
                inline: false,
              };
            }),
          })
        );
      } else {
        await message.channel.send(infoEmbed(`No LINE Notify Config`));
      }
      return;
    }
    const userId = allIds[0];
    const del = Boolean(options['delete']);
    if (del) {
      delete bot.config.lineNotify[userId];
      await message.channel.send(
        successEmbed(`Successfully removed LINE notify config for <@${userId}>`)
      );
      saveConfig('bot', bot.config);
      return;
    }
    const activeStaff = (options['activeStaff'] as RoleNotifyType) || 'NEVER';
    const mention = (options['mention'] as NotifyType) || 'NEVER';
    const token = options['token'] as string;

    if (!activeStaffConfig.includes(activeStaff as any)) {
      throw new CommandArgumentError('Invalid active staff config');
    }
    if (!mentinoConfig.includes(mention as any)) {
      throw new CommandArgumentError('Invalid mention config');
    }
    const currentConfig = bot.config.lineNotify[userId];
    if (!currentConfig && !token) {
      throw new CommandArgumentError('Please set a config');
    }
    if (currentConfig) {
      currentConfig.activeStaff = activeStaff;
      currentConfig.userMention = mention;
    } else {
      if (!token) {
        throw new CommandArgumentError(
          'You must specify a token with the `-t` option.'
        );
      }
      bot.config.lineNotify[userId] = {
        activeStaff,
        userMention: mention,
        lineNotifyToken: token,
      };
    }
    saveConfig('bot', bot.config);
    await message.channel.send(
      successEmbed(`Successfully set LINE notify config`)
    );
  },
};

export default command;
