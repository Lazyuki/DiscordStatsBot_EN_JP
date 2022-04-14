import { CommandArgumentError } from '@/errors';
import { BotCommand } from '@/types';
import { getUserActivity, getUserVoiceActivity } from '@database/statements';
import { getUserId } from '@utils/argumentParsers';
import {
  pastDays,
  dateStringForActivity,
  secondsToVcTime,
} from '@utils/datetime';
import { cleanEmbed, makeEmbed } from '@utils/embed';
import { codeBlock } from '@utils/formatString';
import { idToUser } from '@utils/guildUtils';
import { pluralCount } from '@utils/pluralize';

const MAX_BAR_LENGTH = 20;
const VOICE_HOUR_MULTIPLIER = 50;

const command: BotCommand = {
  name: 'activity',
  aliases: ['ac'],
  requiredServerConfigs: ['statistics'],
  arguments: '[user (default: command invoker)]',
  options: [
    {
      name: 'number',
      short: 'n',
      description: 'Show actual numbers instead of bars',
      bool: true,
    },
    {
      name: 'messageOnly',
      short: 'm',
      description: 'Only show message activity',
      bool: true,
    },
    {
      name: 'voiceOnly',
      short: 'v',
      description: 'Only show voice activity',
      bool: true,
    },
  ],
  description: 'User activity for the past 30 days',
  examples: ['ac', 'ac -n', 'ac @geralt', 'ac -v'],
  normalCommand: async ({ message, bot, server, options, content }) => {
    const showNumbers = Boolean(options['number']);
    const messageOnly = Boolean(options['messageOnly']);
    const voiceOnly = Boolean(options['voiceOnly']);
    if (messageOnly && voiceOnly) {
      throw new CommandArgumentError('You can only select either `-m` or `-v`');
    }

    const userId = getUserId(bot, server, content) || message.author.id;
    const userMessageActivity = voiceOnly
      ? []
      : getUserActivity({
          guildId: server.guild.id,
          userId,
        });
    const userVoiceActivity = messageOnly
      ? []
      : getUserVoiceActivity({
          guildId: server.guild.id,
          userId,
        });

    const hasMessage = userMessageActivity.length > 0;
    const hasVoice = userVoiceActivity.length > 0;

    if (!hasMessage && !hasVoice) {
      await message.channel.send(cleanEmbed('No activity in the past 30 days'));
      return;
    }

    const userStr =
      server.guild.members.cache.get(userId)?.displayName || idToUser(userId);

    let maxMessages = 0;
    let maxVoice = 0;
    const dateToMessages: Record<string, number> = {};
    const dateToVoice: Record<string, number> = {};
    userMessageActivity.forEach((ac) => {
      if (ac.count > maxMessages) maxMessages = ac.count;
      dateToMessages[ac.date] = ac.count;
    });
    userVoiceActivity.forEach((ac) => {
      if (ac.count > maxVoice) maxVoice = ac.count;
      dateToVoice[ac.date] = ac.count;
    });

    const past30Days = pastDays(30);

    let chart = '';
    let footer: string | undefined = undefined;
    if (showNumbers) {
      for (const date of past30Days) {
        const messages = dateToMessages[date.toISOString()] || 0;
        const voiceSeconds = dateToVoice[date.toISOString()] || 0;
        const messagePadding = String(maxMessages).length;
        chart += `${dateStringForActivity(date)}: ${
          !voiceOnly
            ? `Messages: ${spacePadLeft(messages, messagePadding)} `
            : ''
        }${!messageOnly ? `VC: ${secondsToVcTime(voiceSeconds)}` : ''}\n`;
      }
    } else {
      const maxVoiceHours = Math.ceil(maxVoice / (60 * 60));
      const voiceRatio =
        (maxVoiceHours * VOICE_HOUR_MULTIPLIER) / (maxMessages || 1);
      const maxVoiceBarLength = maxVoiceHours
        ? voiceOnly
          ? MAX_BAR_LENGTH
          : Math.max((MAX_BAR_LENGTH * voiceRatio) / (voiceRatio + 1), 1)
        : 0;
      const messageBarUnit = voiceOnly
        ? 1
        : hasMessage
        ? Math.ceil(maxMessages / (MAX_BAR_LENGTH - maxVoiceBarLength))
        : 0;
      const voiceBarUnit = messageOnly
        ? 1
        : hasVoice
        ? Math.ceil(maxVoice / maxVoiceBarLength)
        : 0;
      footer = `${
        voiceOnly || !hasMessage
          ? ''
          : `- is ${pluralCount('message', 's', messageBarUnit)}\n`
      }${
        messageOnly || !hasVoice
          ? ''
          : `+ is ${secondsToVcTime(voiceBarUnit)} of VC`
      }`.trim();
      for (const date of past30Days) {
        const messages = dateToMessages[date.toISOString()] || 0;
        const voiceSeconds = dateToVoice[date.toISOString()] || 0;
        chart += `${dateStringForActivity(date)}: ${'-'.repeat(
          Math.floor(messages / messageBarUnit)
        )}${'+'.repeat(Math.floor(voiceSeconds / voiceBarUnit))}\n`;
      }
    }
    await message.channel.send(
      makeEmbed({
        title: `User activity for ${userStr}`,
        description: codeBlock(chart),
        footer,
      })
    );
  },
};

function spacePadLeft(num: number, totalLength: number) {
  const numLength = String(num).length;
  return ' '.repeat(totalLength - numLength) + num;
}

export default command;
