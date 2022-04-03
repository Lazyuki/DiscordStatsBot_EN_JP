import { BotCommand } from '@/types';
import { errorEmbed, infoEmbed, successEmbed } from '@utils/embed';
import { CommandArgumentError } from '@/errors';
import { parseChannels } from '@utils/argumentParsers';
import { REGEX_RAW_ID } from '@utils/regex';
import hourlyTask from '@tasks/hourlyTask';
import { formatCategoryClock } from '@utils/datetime';

const TIME_STRING_REGEX = /"(.*)"/;

declare module '@/types' {
  interface ServerData {
    categoryClocks: {
      categoryId: string;
      timeString: string;
      zeroPad: boolean;
    }[];
  }
}

const command: BotCommand = {
  name: 'categoryClock',
  aliases: ['cc'],
  isAllowed: ['ADMIN'],
  requiredBotPermissions: ['MANAGE_CHANNELS'],
  description:
    'Set up and configure hourly category clocks. Note that it will only show the 24-hour format. Use "TZ Database Name" from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones inside `{TZ_name}` for specifying the timezone.',
  arguments: '< set | reset > [category/channel ID] ["Time format string"]',
  options: [
    {
      name: 'padding',
      short: 'p',
      description:
        'Pad the hour with a 0 so that `4` becomes `04` but `14` stays `14`',
      bool: true,
    },
  ],
  examples: [
    'cc',
    [
      'cc set 537289285129469954 "Time: 🇯🇵{Asia/Tokyo}時 🇺🇸{America/New_York}時"',
      '=> `Time: 🇯🇵05時 🇺🇸16時`',
    ],
    [
      'cc set 537289285129469954 -p "日本: {Asia/Tokyo}時 | New York: {America/New_York}ʰ"',
      '=> `日本: 5時 | New York: 16h`',
    ],
    'cc reset 537289285129469954',
  ],
  onCommandInit: (server) => {
    server.data.categoryClocks ||= [];
  },
  normalCommand: async ({ content, server, message, options, bot }) => {
    const currentServerClocks = server.data.categoryClocks;
    if (!content) {
      // view current config
      if (currentServerClocks.length === 0) {
        await message.channel.send(infoEmbed(`No category clocks set`));
      } else {
        await message.channel.send(
          infoEmbed(
            currentServerClocks
              .map(
                (cc) =>
                  `Category ID: ${cc.categoryId} => "${cc.timeString}"${
                    cc.zeroPad ? ' with zero-padding' : ''
                  }`
              )
              .join('\n')
          )
        );
      }
      return;
    }

    const [subCommand, channelId] = content.split(/\s+/);
    if (!subCommand || !['set', 'reset'].includes(subCommand)) {
      throw new CommandArgumentError(
        'Use `set` or `reset` to update the category clock'
      );
    }
    switch (subCommand) {
      case 'set': {
        const timeStringMatch = content.match(TIME_STRING_REGEX);
        const timeString = timeStringMatch?.[1];
        if (!timeString) {
          throw new CommandArgumentError(
            'Time format must be surrounded by double quotes.'
          );
        }
        const { channelsAndCategories } = parseChannels(
          channelId,
          server.guild
        );
        if (!channelsAndCategories.length)
          throw new CommandArgumentError(
            'Please provide a valid channel/category in this server'
          );
        const category = channelsAndCategories[0];
        const zeroPad = Boolean(options['padding']);
        let found;
        for (const categoryClock of currentServerClocks) {
          if (categoryClock.categoryId === category.id) {
            found = true;
            categoryClock.zeroPad = zeroPad;
            categoryClock.timeString = timeString;
            break;
          }
        }
        if (!found) {
          server.data.categoryClocks.push({
            categoryId: category.id,
            zeroPad,
            timeString,
          });
        }
        await category.setName(formatCategoryClock(timeString, zeroPad));
        await message.channel.send(successEmbed(`Category clock set!`));
      }
      case 'reset': {
        const idMatch = channelId.match(REGEX_RAW_ID);
        if (!idMatch) {
          throw new CommandArgumentError(
            'Please specify the cateogy ID to reset'
          );
        }
        const id = idMatch[1];
        const foundIndex = currentServerClocks.findIndex(
          (sc) => sc.categoryId === id
        );
        if (foundIndex === -1) {
          await message.channel.send(
            errorEmbed(`Category clock is not set on the category ID: ${id}`)
          );
        } else {
          currentServerClocks.splice(foundIndex, 1);
          await message.channel.send(
            successEmbed(
              `Category clock for <#${id}> has been removed. You must reset the name yourself.`
            )
          );
        }
      }
    }
    server.save();
  },
};

export default command;
