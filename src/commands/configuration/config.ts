import { CommandArgumentError, InvalidSubCommandError } from '@/errors';
import { BotCommand, ServerConfig } from '@/types';
import { parseSnowflakeIDs } from '@utils/argumentParsers';
import { errorEmbed, makeEmbed } from '@utils/embed';
import { camelCaseToNormal } from '@utils/formatString';
import { stripIndent } from 'common-tags';
import { config } from 'dotenv';
import { DEFAULT_PREFIX } from './prefix';

declare module '@/types' {
  interface ServerConfig {
    prefix: string;
    statistics: boolean;
    japaneseRole: string;
    hardcoreRole: string;
    hardcoreIgnoredChannels: string[];
    ignoredChannels: string[];
    hiddenChannels: string[];
    voiceMuteRoles: string[];
    chatMuteRoles: string[];
    blindRoles: string[];
    selfMuteRoles: string[];
    userLogChannel: string;
    logNameChanges: boolean;
    modLogChannel: string;
    ignoredBotPrefixes: string[];
  }
}

type ConfigType = 'channel' | 'boolean' | 'role' | 'string' | 'message';

function getStringConfig(subCommand: string, values: string): string {
  if (subCommand === 'reset') return '';
  if (subCommand === 'set') return values;
  throw new CommandArgumentError('You can only `set` or `reset` this config');
}

function applyConfig<Key extends keyof ServerConfig>(
  configInfo: ConfigInfo<Key>,
  subCommand: string,
  currentSettings: ServerConfig,
  values: string
): string {
  if (configInfo) if (subCommand === 'reset') currentSettings[key] = '';
  if (subCommand === 'set') return values;
  throw new CommandArgumentError('You can only `set` or `reset` this config');
}

function getBooleanConfig(subCommand: string): boolean {
  if (subCommand === 'enable') return true;
  if (subCommand === 'disable') return false;
  throw new CommandArgumentError(
    'You can only `enable` or `disable` this config.'
  );
}

function getStringArrayConfig(
  subCommand: string,
  values: string,
  currentSettings: ServerConfig,
  filter: (id: string) => boolean
): string[] {
  if (subCommand === 'reset') return [];
  if (subCommand === 'add') {
    const { ids } = parseSnowflakeIDs(values);
    const filtered = ids.filter(filter);
    return [...currentSettings, ...filtered];
  }
  if (subCommand === 'remove') {
    const { ids } = parseSnowflakeIDs(values);
    const filtered = currentSettings.filter((s) => !ids.includes(s));
    if (filtered.length === currentSettings.length) {
      throw new CommandArgumentError(
        `None of "${values}" matched the current config`
      );
    }
    return filtered;
  }
  throw new CommandArgumentError(
    'You can only `add`, `remove`, or `reset` this config'
  );
}

interface BooleanConfigInfo {
  type: Extract<ConfigType, 'boolean'>;
  description: string;
  isArray?: false;
  restricted?: boolean;
  parser: (subCommand: string) => boolean;
}
interface StringConfigInfo {
  type: Exclude<ConfigType, 'boolean'>;
  description: string;
  isArray?: false;
  restricted?: boolean;
  parser: (subCommand: string, values: string) => string;
}
interface ArrayConfigInfo {
  type: Exclude<ConfigType, 'boolean'>;
  description: string;
  isArray: true;
  restricted?: boolean;
  parser: (
    subCommand: string,
    values: string,
    currentSettings: string[],
    filter: (id: string) => boolean
  ) => string[];
}

type ConfigInfo<Key extends keyof ServerConfig> = {
  key: Key;
  type: ConfigType;
  description: string;
  isArray?: boolean;
  restricted?: boolean;
  parser: (
    subCommand: string,
    values: string,
    currentSettings: ServerConfig[Key],
    filter: (id: string) => boolean
  ) => ServerConfig[Key];
};

function getConfigInfo<Key extends keyof ServerConfig>(
  config: ConfigInfo<Key>
) {
  return config;
}

const CONFIGURABLE_SERVER_CONFIG = [
  getConfigInfo({
    key: 'prefix',
    type: 'string',
    description: "This bot's command prefix.",
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'statistics',
    type: 'boolean',
    description: 'Enables statistics. Only the bot owner can change this.',
    restricted: true,
    parser: getBooleanConfig,
  }),
  getConfigInfo({
    key: 'japaneseRole',
    type: 'role',
    description: 'Role for native Japanese speakers.',
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'hardcoreRole',
    type: 'role',
    description: 'Role that enables the hardcore mode.',
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'hardcoreIgnoredChannels',
    type: 'channel',
    isArray: true,
    description: 'Channels that are ignored from the hardcore mode.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'ignoredChannels',
    type: 'channel',
    isArray: true,
    description:
      'Channels that are ignored from server statistics. Bot commands will still work. Useful for channels like bot-spam or quiz.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'hiddenChannels',
    type: 'channel',
    isArray: true,
    description:
      'Channels that are hidden from general server statistics. Messages will still be counted, but these channels will only show up on user stats if the command is invoked from one of the hidden channels. Useful for mod channels.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'voiceMuteRoles',
    type: 'role',
    isArray: true,
    description: 'Role that mutes users in voice channels.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'chatMuteRoles',
    type: 'role',
    isArray: true,
    description: 'Role that mutes users in text channels.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'blindRoles',
    type: 'role',
    isArray: true,
    description: 'Role[s] that makes users not able to see/read channels.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'selfMuteRoles',
    type: 'role',
    isArray: true,
    description: 'Role[s] used when users want to mute themselves.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'userLogChannel',
    type: 'channel',
    description:
      'Channel used for logging user join/leave notifications. Setting this channel enables these notifications. You can additinally enable "Log Name Changes" to log nickname/username changes in this channel.',
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'logNameChanges',
    type: 'boolean',
    description:
      'Enables logging user nickname/username changes in the "User Log Channel".',
    parser: getBooleanConfig,
  }),
  getConfigInfo({
    key: 'modLogChannel',
    type: 'channel',
    description: 'Channel used for logging mod related information.',
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'ignoredBotPrefixes',
    type: 'string',
    isArray: true,
    description:
      'Prefixes that are used for other bots in the server. This will prevent bot commands from being included in the server statistics.',
    parser: getStringArrayConfig,
  }),
] as const;

const CONFIG_KEYS = CONFIGURABLE_SERVER_CONFIG.map((c) => c.key) as Readonly<
  (keyof ServerConfig)[]
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
            ${CONFIGURABLE_SERVER_CONFIG.map((config, index) => {
              `**${index + 1}. ${camelCaseToNormal(
                config.key
              )}**: ${formatValue(config.type, server.config[config.key])}`;
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
      const configInfo = CONFIGURABLE_SERVER_CONFIG[configNum - 1];
      const configKey = configInfo.key;
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
        if (configInfo.key === 'prefix') {
          const newVal = configInfo.parser(
            subCommand,
            rest.join(' '),
            server.config[configInfo.key],
            () => true
          );
        }
        if (availableSubCommands.includes(subCommand)) {
          switch (subCommand) {
            case 'enable':
            case 'disable': {
              server.config[configKey] = configInfo.parser(subCommand);
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
