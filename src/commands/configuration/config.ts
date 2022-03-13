import { CommandArgumentError, InvalidSubCommandError } from '@/errors';
import { BotCommand, ServerConfig } from '@/types';
import { errorEmbed, makeEmbed } from '@utils/embed';
import { camelCaseToNormal } from '@utils/formatString';
import { stripIndent } from 'common-tags';
import { DEFAULT_PREFIX } from './prefix';

declare module '@/types' {
  interface ServerConfig {
    prefix: string;
    statistics: boolean;
    japaneseRole?: string;
    hardcoreRole?: string;
    hardcoreIgnoredChannels: string[];
    ignoredChannels: string[];
    hiddenChannels: string[];
    voiceMuteRoles: string[];
    chatMuteRoles: string[];
    blindRoles: string[];
    selfMuteRoles: string[];
    userLogChannel?: string;
    logNameChanges: boolean;
    modLogChannel?: string;
    ignoredBotPrefixes: string[];
    permanentReactionRoleAssignmentMessage?: string; // maybe not
  }
}

type ConfigType = 'channel' | 'boolean' | 'role' | 'string' | 'message';

interface ConfigInfo {
  type: ConfigType;
  description: string;
  isArray?: boolean;
  restricted?: boolean;
}

const CONFIGURABLE_SERVER_CONFIG = {
  prefix: {
    type: 'string',
    description: "This bot's command prefix.",
  },
  statistics: {
    type: 'boolean',
    description: 'Enables statistics. Only the bot owner can change this.',
    restricted: true,
  },
  japaneseRole: {
    type: 'role',
    description: 'Role for native Japanese speakers.',
  },
  hardcoreRole: {
    type: 'role',
    description: 'Role that enables the hardcore mode.',
  },
  hardcoreIgnoredChannels: {
    type: 'channel',
    isArray: true,
    description: 'Channels that are ignored from the hardcore mode.',
  },
  ignoredChannels: {
    type: 'channel',
    isArray: true,
    description:
      'Channels that are ignored from server statistics. Bot commands will still work. Useful for channels like bot-spam or quiz.',
  },
  hiddenChannels: {
    type: 'channel',
    isArray: true,
    description:
      'Channels that are hidden from general server statistics. Messages will still be counted, but these channels will only show up on user stats if the command is invoked from one of the hidden channels. Useful for mod channels.',
  },
  voiceMuteRoles: {
    type: 'role',
    isArray: true,
    description: 'Role that mutes users in voice channels.',
  },
  chatMuteRoles: {
    type: 'role',
    isArray: true,
    description: 'Role that mutes users in text channels.',
  },
  blindRoles: {
    type: 'role',
    isArray: true,
    description: 'Role[s] that makes users not able to see/read channels.',
  },
  selfMuteRoles: {
    type: 'role',
    isArray: true,
    description: 'Role[s] used when users want to mute themselves.',
  },
  userLogChannel: {
    type: 'channel',
    description:
      'Channel used for logging user join/leave notifications. Setting this channel enables these notifications. You can additinally enable "Log Name Changes" to log nickname/username changes in this channel.',
  },
  logNameChanges: {
    type: 'boolean',
    description:
      'Enables logging user nickname/username changes in the "User Log Channel".',
  },
  modLogChannel: {
    type: 'channel',
    description: 'Channel used for logging mod related information.',
  },
  ignoredBotPrefixes: {
    type: 'string',
    isArray: true,
    description:
      'Prefixes that are used for other bots in the server. This will prevent bot commands from being included in the server statistics.',
  },
  permanentReactionRoleAssignmentMessage: {
    type: 'message',
    description:
      'Message link for the reaction role message (generally in #server_rules or somewhere similar) if the reaction role feature is enabled.',
  },
} as const;

const CONFIG_KEYS = Object.keys(CONFIGURABLE_SERVER_CONFIG) as Readonly<
  (keyof typeof CONFIGURABLE_SERVER_CONFIG)[]
>;

function formatStringType(type: ConfigType, value: string) {
  if (type === 'channel') return `<#${value}>`;
  if (type === 'role') return `<@&${value}>`;
  return value;
}

function formatValue(
  type: ConfigType,
  value: string | string[] | boolean | undefined
) {
  if (typeof value === 'string') {
    return formatStringType(type, value);
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'None';
    }
    return value.map((v) => formatStringType(type, v)).join(', ');
  } else if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  } else {
    return 'None';
  }
}

function getAvailableSubCommands(type: ConfigType, isArray?: boolean) {
  if (isArray) {
    return ['add', 'remove', 'reset'];
  } else if (type === 'boolean') {
    return ['enable', 'disable'];
  } else {
    return ['set', 'reset'];
  }
}

function getAvailableValues(type: ConfigType, isArray?: boolean) {
  switch (type) {
    case 'boolean':
      return '';
    case 'channel':
      return isArray ? '#channel1 #channel2...' : '#channel';
    case 'role':
      return isArray ? '@role1 @role2...' : '@role';
    case 'string':
      return 'value';
    case 'message':
      return 'https://discord.com/channels/189571157446492161/941928326258384897/941928326258384897';
  }
}

const command: BotCommand = {
  name: 'config',
  isAllowed: 'ADMIN',
  onCommandInit: (server) => {
    server.config.hardcoreIgnoredChannels ||= [];
  },
  description: 'View or update bot config for this server',
  arguments: '[number] [add/remove | enable/disable | set/reset] [value]',
  examples: [
    'config',
    'config 2',
    'config 4 set @Native Japanese Speaker',
    'config 4 reset',
    'config 3 add #bot-spam',
    'config 3 remove #bot-spam',
    'config 14 enable',
  ],
  normalCommand: async ({ commandContent, message, server, bot }) => {
    if (!commandContent) {
      // Show current config
      await message.channel.send(
        makeEmbed({
          title: 'Current Server Configuration',
          description: stripIndent`
            ${CONFIG_KEYS.map((configKey, index) => {
              `**${index + 1}. ${camelCaseToNormal(configKey)}**: ${formatValue(
                CONFIGURABLE_SERVER_CONFIG[configKey].type,
                server.config[configKey]
              )}`;
            }).join('\n')}
            `,
          footer: `Type "${server.config.prefix}config config_number help" for more info on each config`,
        })
      );
    } else {
      const [configNumStr, subCommand, ...rest] = commandContent.split(/\s+/);
      const configNum = parseInt(configNumStr);
      if (
        isNaN(configNum) ||
        configNum <= 0 ||
        configNum > CONFIG_KEYS.length
      ) {
        throw new CommandArgumentError(
          `${configNumStr} is not a valid config number. Type \`${server.config.prefix}config\` to show the list of config and numbers`
        );
      }
      const configKey = CONFIG_KEYS[configNum - 1];
      const configInfo = CONFIGURABLE_SERVER_CONFIG[configKey] as ConfigInfo;
      const currentConfig = server.config[configKey];
      const availableSubCommands = getAvailableSubCommands(
        configInfo.type,
        configInfo.isArray
      );
      const possibleValues = getAvailableValues(
        configInfo.type,
        configInfo.isArray
      );
      if (!subCommand) {
        await message.channel.send(
          makeEmbed({
            title: camelCaseToNormal(configKey),
            description: stripIndent`
            **Description**: ${configInfo.description}
            **Current Value**: ${formatValue(configInfo.type, currentConfig)}
            **Value Type**: ${configInfo.isArray ? 'Array of ' : ''}\`${
              configInfo.type
            }\`${configInfo.isArray ? 's' : ''}
            **How to Update**: ${
              configInfo.restricted
                ? `Contact the bot owner <@${bot.ownerId}> to update this value**`
                : `Type \`${
                    server.config.prefix
                  }config ${configNum} ${availableSubCommands.join(
                    '/'
                  )} ${possibleValues}\``
            }
            `,
          })
        );
      } else {
        if (configInfo.restricted && message.author.id !== bot.ownerId) {
          await message.channel.send(
            errorEmbed(`Only the bot owner can update this config.`)
          );
          return;
        }
        if (availableSubCommands.includes(subCommand)) {
          switch (subCommand) {
            case 'enable':
            case 'disable': {
              (server.config[configKey] as any) = subCommand === 'enable';
              return;
            }
            case 'reset': {
              if (configKey === 'prefix') {
                server.config.prefix = DEFAULT_PREFIX;
              } else {
                (server.config[configKey] as any) = configInfo.isArray
                  ? []
                  : undefined;
              }
              return;
            }
            case 'set': {
              const value = rest[0];
              if (!value)
                throw new CommandArgumentError(
                  `You need to specify some value when using \`set\` in \`config\``
                );
            }
          }
        } else {
          throw new CommandArgumentError(
            `${subCommand} is not the correct sub command for this config. Use one of [ ${availableSubCommands.join(
              ' | '
            )} ] to update this config.`
          );
        }
      }
    }
  },
};

export default command;
