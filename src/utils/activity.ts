import { CommandArgumentError } from '@/errors';
import { GuildMessage } from '@/types';
import { codeBlock } from '@utils/formatString';
import { pastDays, dateStringForActivity, secondsToVcTime } from './datetime';
import { cleanEmbed, makeEmbed } from './embed';
import { pluralCount } from './pluralize';

const MAX_BAR_LENGTH = 18;

export async function showActivity({
  message,
  title,
  showNumbers,
  messageOnly,
  voiceOnly,
  messageActivity,
  voiceActivity,
  voiceHourMultiplier = 50,
}: {
  message: GuildMessage;
  title: string;
  showNumbers: boolean;
  messageOnly: boolean;
  voiceOnly: boolean;
  messageActivity: any[];
  voiceActivity: any[];
  voiceHourMultiplier?: number;
}) {
  if (messageOnly && voiceOnly) {
    throw new CommandArgumentError('You can only select either `-m` or `-v`');
  }

  const hasMessage = messageActivity.length > 0;
  const hasVoice = voiceActivity.length > 0;

  if (!hasMessage && !hasVoice) {
    await message.channel.send(cleanEmbed('No activity in the past 30 days'));
    return;
  }

  let maxMessages = 0;
  let maxVoice = 0;
  const dateToMessages: Record<string, number> = {};
  const dateToVoice: Record<string, number> = {};
  messageActivity.forEach((ac) => {
    if (ac.count > maxMessages) maxMessages = ac.count;
    dateToMessages[ac.date] = ac.count;
  });
  voiceActivity.forEach((ac) => {
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
        !voiceOnly ? `Messages: ${spacePadLeft(messages, messagePadding)} ` : ''
      }${!messageOnly ? `VC: ${secondsToVcTime(voiceSeconds)}` : ''}\n`;
    }
  } else {
    const maxVoiceHours = Math.ceil(maxVoice / (60 * 60));
    const voiceRatio =
      (maxVoiceHours * voiceHourMultiplier) / (maxMessages || 1);
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
      title,
      description: codeBlock(chart),
      footer,
    })
  );
}

function spacePadLeft(num: number, totalLength: number) {
  const numLength = String(num).length;
  return ' '.repeat(totalLength - numLength) + num;
}
