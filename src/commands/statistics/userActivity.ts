import { BotCommand } from '@/types';
import { getUserActivity } from '@database/statements';
import { getUserId } from '@utils/argumentParsers';
import { pastDays, dateStringForActivity } from '@utils/datetime';
import { makeEmbed } from '@utils/embed';
import { codeBlock } from '@utils/formatString';
import { idToUser } from '@utils/guildUtils';
import { pluralCount } from '@utils/pluralize';

const command: BotCommand = {
  name: 'activity',
  aliases: ['ac'],
  requiredServerConfigs: ['statistics'],
  arguments: '[user name]',
  options: [
    {
      name: 'number',
      short: 'n',
      description: 'Show number of messages instead of relative activity',
      bool: true,
    },
  ],
  description: 'User activity for the past 30 days',
  examples: ['ac', 'ac -n', 'ac @geralt'],
  normalCommand: async ({ message, bot, server, options, content }) => {
    const showNumbers = Boolean(options['number']);
    const userId = getUserId(bot, server, content) || message.author.id;
    const userActivity = getUserActivity({
      guildId: server.guild.id,
      userId: userId,
    });

    if (!userActivity.length) {
      await message.channel.send('User not active');
      return;
    }

    const userStr =
      server.guild.members.cache.get(userId)?.displayName || idToUser(userId);

    const maxBars = '---------------';
    let maxMessages = 0;
    const dateToCount: Record<string, number> = {};
    userActivity.forEach((ac) => {
      if (ac.count > maxMessages) maxMessages = ac.count;
      dateToCount[ac.date] = ac.count;
    });

    const past30Days = pastDays(30);

    let chart = '';
    let unit = 1;
    if (showNumbers) {
      for (const date of past30Days) {
        const count = dateToCount[date.toISOString()] || 0;
        chart += `${dateStringForActivity(date)}: ${count}\n`;
      }
    } else {
      unit = Math.ceil(maxMessages / maxBars.length);
      for (const date of past30Days) {
        console.log(date.toISOString());
        const count = dateToCount[date.toISOString()] || 0;
        chart += `${dateStringForActivity(date)}: ${maxBars.substring(
          0,
          Math.floor(count / unit)
        )}\n`;
      }
    }
    await message.channel.send(
      makeEmbed({
        title: `User activity for ${userStr}`,
        description: codeBlock(chart),
        footer: !showNumbers
          ? `Bar unit: ${pluralCount('message', 's', unit)}`
          : undefined,
      })
    );
  },
};

export default command;
