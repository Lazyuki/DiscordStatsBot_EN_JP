import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseChannels, parseSnowflakeIds } from '@utils/argumentParsers';
import { errorEmbed, successEmbed } from '@utils/embed';
import { joinNaturally } from '@utils/formatString';
import { idToChannel } from '@utils/guildUtils';
import { isOrAre } from '@utils/pluralize';

const ignore: BotCommand = {
  name: 'ignore',
  isAllowed: 'ADMIN',
  onCommandInit: (server) => {
    server.config.ignoredChannels ||= [];
  },
  description:
    'Ignore channels/categories from statistics. Bot commands will still work there. Useful for ignoring noisy channels such as quiz or bot-spam channels.',
  arguments: '<#channel> [#channel2 ... ] [#category ...]',
  childCommands: ['ignored', 'unignore'],
  normalCommand: async ({ content, message, server }) => {
    const { channelsAndCategories } = parseChannels(content, server.guild);
    if (channelsAndCategories.length > 0) {
      for (const channel of channelsAndCategories) {
        if (server.config.ignoredChannels.includes(channel.id)) continue;
        server.config.ignoredChannels.push(channel.id);
      }
      server.save();
      await message.channel.send(
        successEmbed(
          `${joinNaturally(
            channelsAndCategories.map((c) => c.toString())
          )} ${isOrAre(
            channelsAndCategories.length
          )} ignored from statistics now.`
        )
      );
    } else {
      await message.channel.send(
        errorEmbed(`Please specify existing channels`)
      );
    }
  },
};

const ignored: BotCommand = {
  name: 'ignored',
  isAllowed: 'SERVER_MODERATOR',
  description: 'Show ignored channels',
  parentCommand: 'ignore',
  normalCommand: async ({ message, server }) => {
    const channels = server.config.ignoredChannels;
    let s = '';
    for (const channelId of channels) {
      s += `<#${channelId}>\n`;
    }
    await message.channel.send(s);
  },
};

const unignore: BotCommand = {
  name: 'unignore',
  isAllowed: 'SERVER_MODERATOR',
  description: 'Un-ignore channels',
  parentCommand: 'ignore',
  normalCommand: async ({ message, server, content }) => {
    const { ids } = parseSnowflakeIds(content);
    if (
      ids.length > 0 &&
      ids.some((id) => server.config.ignoredChannels.includes(id))
    ) {
      server.config.ignoredChannels = server.config.ignoredChannels.filter(
        (id) => !ids.includes(id)
      );
      server.save();
      await message.channel.send(
        `${joinNaturally(ids.map(idToChannel))} ${isOrAre(
          ids.length
        )} un-ignored from statistics now.`
      );
    } else {
      throw new CommandArgumentError(
        'Please specify channels that are currently ignored'
      );
    }
  },
};

export default [ignore, ignored, unignore];
