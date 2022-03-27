import { stripIndent } from 'common-tags';

import { CommandArgumentError } from '@/errors';
import { BotCommand, BotConfig, ServerConfig } from '@/types';
import { parseSnowflakeIds } from '@utils/argumentParsers';
import { errorEmbed, makeEmbed, successEmbed } from '@utils/embed';
import { camelCaseToNormal } from '@utils/formatString';
import { CategoryChannel, Guild } from 'discord.js';
import { DEFAULT_PREFIX } from '@/envs';
import { REGEX_MESSAGE_ID } from '@utils/regex';
import { idToChannel } from '@utils/guildUtils';

type ConfigType = 'channel' | 'boolean' | 'string';

function getStringConfig(subCommand: string, values: string): string {
  if (subCommand === 'reset') return '';
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

type ConfigInfo<Key extends keyof BotConfig> = {
  key: Key;
  type: ConfigType;
  description: string;
  isArray: BotConfig[Key] extends any[] ? true : false;
  restricted?: boolean;
  parser: (
    subCommand: string,
    values: string,
    currentSettings: BotConfig[Key]
  ) => BotConfig[Key];
};

function getConfigInfo<Key extends keyof BotConfig>(
  config: ConfigInfo<Key>
): ConfigInfo<Key> {
  return config;
}

const CONFIGURABLE_BOT_CONFIG = [
  getConfigInfo({
    key: 'beginnerKanjis',
    type: 'string',
    description: 'List of kanji considered beginner-friendly',
    isArray: true,
    parser: getStringArrayConfig,
  }),
] as const;

const CONFIG_KEYS = CONFIGURABLE_BOT_CONFIG.map((c) => c.key) as Readonly<
  (keyof BotConfig)[]
>;

function formatStringType(type: ConfigType, value: string) {
  if (!value) return '`None`';
  if (type === 'channel') return idToChannel(value);
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
          `You can only add text channels from this server`
        );
      }
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
  }
}

function sanitizeValue(type: ConfigType, value: string, guild: Guild): string {
  if (type === 'channel') {
    const { ids } = parseSnowflakeIds(value, true);
    if (ids.length === 0) {
      if (!value) {
        throw new CommandArgumentError(`You must specify ${type}s`);
      }
      const nameMatch = getByName(type, value, guild);
      if (!nameMatch) {
        throw new CommandArgumentError(`Could not find the ${type}`);
      }
      if (nameMatch.size === 0) {
        throw new CommandArgumentError(`Could not find the ${type}`);
      } else if (nameMatch.size === 1) {
        return nameMatch.first()!.id;
      } else {
        throw new CommandArgumentError(
          `The name \`${value}\` matched multiple ${type}s`
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
    case 'string':
      return 'value';
  }
}

const command: BotCommand = {
  name: 'botConfig',
  isAllowed: ['BOT_OWNER'],
  aliases: ['bc'],
  description: 'View or update configuration for the bot',
  arguments: '[number] [add/remove | enable/disable | set/reset] [value]',
  examples: ['bc', 'bc 2', 'bc 4 reset'],
  normalCommand: async ({ content, message, server, bot, ...rest }) => {
    if (!content) {
      // Show current config
      await message.channel.send(
        makeEmbed({
          title: 'Current Server Configuration',
          description: CONFIGURABLE_BOT_CONFIG.map(
            (config, index) =>
              `${index + 1}. **${camelCaseToNormal(
                config.key
              )}**: ${formatValue(config.type, bot.botConfig[config.key])}`
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
      const configInfo = CONFIGURABLE_BOT_CONFIG[configNum - 1];
      const configKey = configInfo.key;
      const currentConfig = bot.botConfig[configKey];
      if (!subCommand || subCommand === 'help') {
        const availableSubCommands = getAvailableSubCommands(
          configInfo.type,
          configInfo.isArray
        );
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
            **Value Type**: ${configInfo.isArray ? 'Array of ' : ''}\`${
              configInfo.type
            }\`${configInfo.isArray ? 's' : ''}
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
          await message.channel.send(
            errorEmbed(`Only the bot owner can update this config.`)
          );
          return;
        }
        const configValue = sanitizeValue(
          configInfo.type,
          restCommand.join(' '),
          server.guild
        );

        // Typescript can't handle it but these types are checked at build time.
        (bot.botConfig[configKey] as any) = configInfo.parser(
          subCommand,
          configValue,
          bot.botConfig[configKey] as never
        );
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
