import { stripIndent } from 'common-tags';

import { CommandArgumentError, UserPermissionError } from '@/errors';
import { BotCommand, ServerConfig } from '@/types';
import { parseSnowflakeIds } from '@utils/argumentParsers';
import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { camelCaseToNormal, joinNaturally } from '@utils/formatString';
import { CategoryChannel, Guild } from 'discord.js';
import { DEFAULT_PREFIX } from '@/envs';
import { REGEX_MESSAGE_ID } from '@utils/regex';
import { id } from 'date-fns/locale';
import { idToChannel, idToRole } from '@utils/guildUtils';

declare module '@/types' {
  interface ServerConfig {
    prefix: string;
    statistics: boolean;
    japaneseRoles: string[];
    hardcoreRole: string;
    hardcoreIgnoredChannels: string[];
    ignoredChannels: string[];
    hiddenChannels: string[];
    voiceMuteRoles: string[];
    chatMuteRoles: string[];
    focusRoles: string[];
    selfMuteRoles: string[];
    userLogChannel: string;
    logUserJoinLeaves: boolean;
    logNameChanges: boolean;
    modLogChannel: string;
    ignoredBotPrefixes: string[];
  }
}

const DEFAULT_CONFIG: ServerConfig = {
  prefix: DEFAULT_PREFIX,
  statistics: false,
  japaneseRoles: [],
  hardcoreRole: '',
  hardcoreIgnoredChannels: [],
  ignoredChannels: [],
  hiddenChannels: [],
  voiceMuteRoles: [],
  chatMuteRoles: [],
  focusRoles: [],
  selfMuteRoles: [],
  userLogChannel: '',
  logUserJoinLeaves: false,
  logNameChanges: false,
  modLogChannel: '',
  ignoredBotPrefixes: [],
};

type ConfigType =
  | 'channel'
  | 'channelOrCategory'
  | 'boolean'
  | 'role'
  | 'string'
  | 'message';

type SubCommand = 'set' | 'reset' | 'add' | 'remove' | 'enable' | 'disable';

function getStringConfig(subCommand: SubCommand, values: string): string {
  if (subCommand === 'reset') return '';
  if (subCommand === 'set') return values;
  throw new CommandArgumentError('You can only `set` or `reset` this config');
}

function getBooleanConfig(subCommand: SubCommand): boolean {
  if (subCommand === 'enable') return true;
  if (subCommand === 'disable') return false;
  throw new CommandArgumentError(
    'You can only `enable` or `disable` this config.'
  );
}

function getStringArrayConfig(
  subCommand: SubCommand,
  values: string,
  currentSettings: string[]
): string[] {
  const ids = values.split(' ');
  if (subCommand === 'reset') return [];
  if (subCommand === 'add') {
    return [...currentSettings, ...ids];
  }
  if (subCommand === 'remove') {
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

type ConfigInfo<Key extends keyof ServerConfig> = {
  key: Key;
  type: ConfigType;
  description: string;
  isArray: ServerConfig[Key] extends any[] ? true : false;
  restricted?: boolean;
  parser: (
    subCommand: SubCommand,
    values: string,
    currentSettings: ServerConfig[Key]
  ) => ServerConfig[Key];
};

function getConfigInfo<Key extends keyof ServerConfig>(
  config: ConfigInfo<Key>
): ConfigInfo<Key> {
  return config;
}

const CONFIGURABLE_SERVER_CONFIG = [
  getConfigInfo({
    key: 'prefix',
    type: 'string',
    isArray: false,
    description: "This bot's command prefix.",
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'statistics',
    type: 'boolean',
    isArray: false,
    description: 'Enables statistics. Only the bot owner can change this.',
    restricted: true,
    parser: getBooleanConfig,
  }),
  getConfigInfo({
    key: 'japaneseRoles',
    type: 'role',
    isArray: true,
    description:
      'Roles for native Japanese speakers. This will affect hardcore mode and user statistics',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'hardcoreRole',
    type: 'role',
    isArray: false,
    description: 'Role used for hardcore mode.',
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'hardcoreIgnoredChannels',
    type: 'channelOrCategory',
    isArray: true,
    description: 'Channels or categories that are ignored from hardcore mode.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'ignoredChannels',
    type: 'channelOrCategory',
    isArray: true,
    description:
      'Channels or categories that are ignored from server statistics. Bot commands will still work. Useful for channels like bot-spam or quiz.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'hiddenChannels',
    type: 'channel',
    isArray: true,
    description:
      'Channels or categories that are hidden from general server statistics. Messages will still be counted, but these channels will only show up on user stats if the command is invoked from one of the hidden channels. Useful for mod channels.',
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
    description: 'Roles that mute users in text channels.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'focusRoles',
    type: 'role',
    isArray: true,
    description: 'Roles that make users to not see/read channels.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'selfMuteRoles',
    type: 'role',
    isArray: true,
    description: 'Roles used when users want to mute themselves.',
    parser: getStringArrayConfig,
  }),
  getConfigInfo({
    key: 'userLogChannel',
    type: 'channel',
    isArray: false,
    description:
      'Channel used for logging user join/leave notifications. Setting this channel enables these notifications. You can additinally enable "Log Name Changes" to log nickname/username changes in this channel.',
    parser: getStringConfig,
  }),
  getConfigInfo({
    key: 'logUserJoinLeaves',
    type: 'boolean',
    isArray: false,
    description: 'Enable logging user joins/leaves in the "User Log Channel".',
    parser: getBooleanConfig,
  }),
  getConfigInfo({
    key: 'logNameChanges',
    type: 'boolean',
    isArray: false,
    description:
      'Enable logging user nickname/username changes in the "User Log Channel".',
    parser: getBooleanConfig,
  }),
  getConfigInfo({
    key: 'modLogChannel',
    type: 'channel',
    isArray: false,
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
  if (!value) return '`None`';
  if (type === 'channel' || type === 'channelOrCategory')
    return idToChannel(value);
  if (type === 'role') return idToRole(value);
  return `\`${value}\``;
}

function formatValue(
  type: ConfigType,
  value: string | string[] | boolean | undefined
) {
  if (typeof value === 'string') {
    return formatStringType(type, value);
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return '`None`';
    }
    return value.map((v) => formatStringType(type, v)).join(', ');
  } else if (typeof value === 'boolean') {
    return value ? '`Enabled`' : '`Disabled`';
  } else {
    return '`None`';
  }
}

function isValidRole(id: string, guild: Guild) {
  return guild.roles.cache.has(id);
}
function isValidChannel(id: string, guild: Guild) {
  const channel = guild.channels.cache.get(id);
  return Boolean(channel && channel.isText() && !channel.isThread());
}
function isValidCategoryOrChannel(id: string, guild: Guild) {
  const channel = guild.channels.cache.get(id);
  if (!channel) return false;
  return (
    Boolean(channel.isText() && !channel.isThread()) ||
    channel instanceof CategoryChannel
  );
}

function validateIds(configType: ConfigType, ids: string[], guild: Guild) {
  switch (configType) {
    case 'channel':
      if (!ids.every((id) => isValidChannel(id, guild))) {
        throw new CommandArgumentError(
          `You can only specify text channels from this server`
        );
      }
      return true;
    case 'channelOrCategory':
      if (!ids.every((id) => isValidCategoryOrChannel(id, guild))) {
        throw new CommandArgumentError(
          `You can only specify text channels or category channels from this server`
        );
      }
      return true;
    case 'role':
      if (!ids.every((id) => isValidRole(id, guild))) {
        throw new CommandArgumentError(
          `You can only specify roles in this server`
        );
      }
      return true;
    default:
      return true;
  }
}

function getByName(type: ConfigType, name: string, guild: Guild) {
  switch (type) {
    case 'channel':
      return guild.channels.cache.filter(
        (ch) => isValidChannel(ch.id, guild) && ch.name.includes(name)
      );
    case 'channelOrCategory':
      return guild.channels.cache.filter(
        (ch) => isValidCategoryOrChannel(ch.id, guild) && ch.name.includes(name)
      );
    case 'role':
      return guild.roles.cache.filter((role) =>
        role.name.toLowerCase().includes(name.toLowerCase())
      );
  }
}

const SUB_COMMANDS_TO_VERIFY = ['add', 'remove', 'set'];

function sanitizeValue(
  subCommand: SubCommand,
  type: ConfigType,
  value: string,
  guild: Guild
): string {
  // No need to check
  if (!SUB_COMMANDS_TO_VERIFY.includes(subCommand)) return value;
  if (subCommand === 'remove') {
    if (type === 'string') return value;
    const { ids } = parseSnowflakeIds(value, true);
    return ids.join(' ');
  }

  if (type === 'message') {
    const messageMatch = value.match(REGEX_MESSAGE_ID);
    if (messageMatch) {
      const [_, channelId, messageId] = messageMatch;
      return `${channelId}-${messageId}`;
    }
    throw new CommandArgumentError(`Invalid message ID`);
  } else if (['channel', 'channelOrCategory', 'role'].includes(type)) {
    const { ids } = parseSnowflakeIds(value, true);
    const typeString = `\`${camelCaseToNormal(type)}\``;
    if (ids.length === 0) {
      if (!value) {
        throw new CommandArgumentError(`You must specify a ${typeString}`);
      }
      const nameMatch = getByName(type, value, guild);
      if (!nameMatch) {
        throw new CommandArgumentError(`Could not find the ${typeString}`);
      }
      if (nameMatch.size === 0) {
        throw new CommandArgumentError(`Could not find the ${typeString}`);
      } else if (nameMatch.size === 1) {
        return nameMatch.first()!.id;
      } else {
        throw new CommandArgumentError(
          `The name \`${value}\` matched multiple ${typeString}`
        );
      }
    } else {
      validateIds(type, ids, guild);
      return ids.join(' ');
    }
  } else {
    return value;
  }
}

function getAvailableSubCommands(
  type: ConfigType,
  isArray?: boolean
): SubCommand[] {
  if (isArray) {
    return ['add', 'remove', 'reset'];
  } else if (type === 'boolean') {
    return ['enable', 'disable'];
  } else {
    return ['set', 'reset'];
  }
}

function isSubCommand(
  subCommand: any,
  availableSubCommands: SubCommand[]
): subCommand is SubCommand {
  return availableSubCommands.includes(subCommand);
}

function getAvailableValues(type: ConfigType, isArray?: boolean) {
  switch (type) {
    case 'boolean':
      return '';
    case 'channel':
      return isArray ? '#channel1 #channel2...' : '#channel';
    case 'channelOrCategory':
      return isArray ? '#channel1 #category...' : '#channel';
    case 'role':
      return isArray ? '@role1 @role2...' : '@role';
    case 'string':
      return 'value';
    case 'message':
      return 'https://discord.com/channels/123456789123456789/123456789123456789/123456789123456789';
  }
}

const command: BotCommand = {
  name: 'config',
  isAllowed: ['ADMIN'],
  onCommandInit: (server) => {
    server.config = { ...DEFAULT_CONFIG, ...server.config };
  },
  description: 'View or update configuration for this server',
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
  normalCommand: async ({ content, message, server, bot, ...rest }) => {
    if (!content) {
      // Show current config
      await message.channel.send(
        makeEmbed({
          title: 'Current Server Configuration',
          description: CONFIGURABLE_SERVER_CONFIG.map(
            (config, index) =>
              `${index + 1}. **${camelCaseToNormal(
                config.key
              )}**: ${formatValue(config.type, server.config[config.key])}`
          ).join('\n'),
          footer: `Type "${server.config.prefix}config config_number help" for more info on each config`,
        })
      );
    } else {
      let [configNumStr, subCommand, ...restCommand] = content
        .toLowerCase()
        .split(/\s+/);
      if (!isNaN(parseInt(subCommand))) {
        // Maybe switched subcommand and config num
        const temp = configNumStr;
        configNumStr = subCommand;
        subCommand = temp;
      }
      const configNum = parseInt(configNumStr);
      if (
        isNaN(configNum) ||
        configNum <= 0 ||
        configNum > CONFIG_KEYS.length
      ) {
        throw new CommandArgumentError(
          `${configNumStr} is not a valid config number. Type \`${server.config.prefix}config\` to show the list of configs and their numbers`
        );
      }
      const configInfo = CONFIGURABLE_SERVER_CONFIG[configNum - 1];
      const configKey = configInfo.key;
      const currentConfig = server.config[configKey];
      const availableSubCommands = getAvailableSubCommands(
        configInfo.type,
        configInfo.isArray
      );
      if (!subCommand || subCommand === 'help') {
        const possibleValues = getAvailableValues(
          configInfo.type,
          configInfo.isArray
        );
        await message.channel.send(
          makeEmbed({
            title: camelCaseToNormal(configKey),
            description: stripIndent`
            **Description**: ${configInfo.description}
            **Current Value**: ${formatValue(configInfo.type, currentConfig)}
            **Value Type**: ${
              configInfo.isArray ? 'Array of ' : ''
            }\`${camelCaseToNormal(configInfo.type)}\`
            **How to Update**: ${
              configInfo.restricted
                ? `Contact the bot owner <@${bot.ownerId}> to update this value`
                : `Type \`${
                    server.config.prefix
                  }config ${configNum} <${availableSubCommands.join(
                    ' | '
                  )}> [${possibleValues}]\``
            }
            `,
          })
        );
      } else {
        if (configInfo.restricted && message.author.id !== bot.ownerId) {
          throw new UserPermissionError(
            `Only the bot owner can update this config.`
          );
        }
        if (!isSubCommand(subCommand, availableSubCommands)) {
          throw new CommandArgumentError(
            `The available sub commands are ${joinNaturally(
              availableSubCommands
            )}.`
          );
        }
        const configValue = sanitizeValue(
          subCommand,
          configInfo.type,
          restCommand.join(' '),
          server.guild
        );
        if (configInfo.key === 'prefix') {
          await bot.commands['prefix'].normalCommand?.({
            content: subCommand === 'set' ? configValue : '',
            message,
            server,
            bot,
            ...rest,
          });
          return;
        }
        // Typescript can't handle it but these types are checked at build time.
        (server.config[configKey] as any) = configInfo.parser(
          subCommand,
          configValue,
          server.config[configKey] as never
        );
        server.save();
        await message.channel.send(
          successEmbed(
            `Config for **${camelCaseToNormal(configKey)}** has been updated.`
          )
        );
        return;
      }
    }
  },
};

export default command;
