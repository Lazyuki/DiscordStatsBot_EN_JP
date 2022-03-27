import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { parseChannels, parseSnowflakeIds } from '@utils/argumentParsers';
import { errorEmbed, infoEmbed, successEmbed } from '@utils/embed';
import { joinNaturally } from '@utils/formatString';
import { idToChannel } from '@utils/guildUtils';
import { isOrAre } from '@utils/pluralize';

const hide: BotCommand = {
  name: 'hide',
  isAllowed: ['ADMIN'],
  onCommandInit: (server) => {
    server.config.hiddenChannels ||= [];
  },
  description:
    'Hide a channel from statistics commands, unless invoked in one of the hidden channels. Useful for keeping mod channels hidden',
  arguments: '<#channel> [#channel2 ... ]',
  childCommands: ['hidden', 'unhide'],
  normalCommand: async ({ content, message, server }) => {
    const { channels } = parseChannels(content, server.guild);
    if (channels.length > 0) {
      for (const channel of channels) {
        if (server.config.hiddenChannels.includes(channel.id)) continue;
        server.config.hiddenChannels.push(channel.id);
      }
      server.save();
      await message.channel.send(
        successEmbed(
          `${joinNaturally(channels.map((c) => c.toString()))} ${isOrAre(
            channels.length
          )} hidden now.`
        )
      );
    } else {
      throw new CommandArgumentError(`Please specify existing channels`);
    }
  },
};

const hidden: BotCommand = {
  name: 'hidden',
  isAllowed: ['ADMIN'],
  description: 'Show hidden channels',
  parentCommand: 'hide',
  normalCommand: async ({ message, server }) => {
    const channels = server.config.hiddenChannels;
    let s = '';
    for (const channelId of channels) {
      s += `${idToChannel(channelId)}\n`;
    }
    await message.channel.send(infoEmbed(s));
  },
};

const unhide: BotCommand = {
  name: 'unhide',
  isAllowed: ['ADMIN'],
  description: 'Un-hide channels',
  parentCommand: 'hide',
  normalCommand: async ({ message, server, content }) => {
    const { ids } = parseSnowflakeIds(content);
    if (
      ids.length > 0 &&
      ids.some((id) => server.config.hiddenChannels.includes(id))
    ) {
      server.config.hiddenChannels = server.config.hiddenChannels.filter(
        (id) => !ids.includes(id)
      );
      server.save();
      await message.channel.send(
        `${joinNaturally(ids.map(idToChannel))} ${isOrAre(
          ids.length
        )} un-hidden now.`
      );
    } else {
      throw new CommandArgumentError(
        'Please specify channels that are currently hidden'
      );
    }
  },
};

export default [hide, hidden, unhide];
