import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { infoEmbed } from '@utils/embed';
import { secondsToVcTime } from '@utils/datetime';
import {
  getDeletesForUser,
  getTop3EmojiForUser,
  getUserMessages,
  getVoiceSecondsForUser,
} from '@database/statements';
import { channelName, formatPercent, resolveEmoji } from '@utils/formatString';
import { pluralCount } from '@utils/pluralize';
import {
  channelsOrCategoriesToChannels,
  isInChannelsOrCategories,
} from '@utils/guildUtils';

const command: BotCommand = {
  name: 'user',
  description: 'Show user statistics',
  aliases: ['u'],
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const userId = getUserId(bot, server, content) || message.author.id;
    const member = server.guild.members.cache.get(userId);

    const hiddenChannels = isInChannelsOrCategories(
      message,
      server.config.hiddenChannels
    )
      ? []
      : channelsOrCategoriesToChannels(
          server.config.hiddenChannels,
          server.guild
        );

    const guildUser = {
      guildId: server.guild.id,
      userId: userId,
    };
    const userRows = getUserMessages(guildUser, hiddenChannels);
    let totalMessages = 0;
    let weekMessages = 0;
    let englishUsage = 0;
    let japaneseUsage = 0;
    let channels: { channelId: string; count: number }[] = [];

    if (userRows.length > 2) {
      // always two rows even if the user hasn't said anything
      const [totalMessagesRow, weekMessagesRow, ...restRows] = userRows;
      totalMessages = totalMessagesRow.count || 0;
      weekMessages = weekMessagesRow.count || 0;
      restRows.forEach((row) => {
        if (row.lang) {
          if (row.lang === 'EN') englishUsage = row.count;
          if (row.lang === 'JP') japaneseUsage = row.count;
        } else if (row.channelId) {
          channels.push({ channelId: row.channelId, count: row.count });
        }
      });
    }

    const emojis = getTop3EmojiForUser(guildUser);
    const voiceRow = getVoiceSecondsForUser(guildUser);
    const voiceSeconds = voiceRow[0]?.count || 0;
    const deletesRow = getDeletesForUser(guildUser);
    const deletes = deletesRow[0]?.count || 0;
    // Title
    const user = bot.users.cache.get(userId);
    const titleName = member
      ? `${member.user.tag}${member.nickname ? ` aka ${member.nickname}` : ''}`
      : user
      ? user.tag
      : `User <@${userId}>`;

    const noStats =
      totalMessages === 0 && voiceSeconds === 0 && emojis.length === 0;
    if (noStats) {
      await message.channel.send(
        infoEmbed({
          title: `Stats for ${titleName}`,
          description: `No server activity in the past 30 days.`,
          footer: member ? 'Joined this server' : 'User not in the server',
          timestamp: member?.joinedTimestamp || undefined,
        })
      );
    } else {
      // Language Usage
      const japaneseRoles = server.config.japaneseRoles;
      const totalLanguageMessages = englishUsage + japaneseUsage;
      const showLanguageUsage =
        japaneseRoles.length > 0 && totalLanguageMessages > 0;
      const isJapanese = member?.roles.cache.hasAny(...japaneseRoles);
      const languageUsage = isJapanese
        ? englishUsage / totalLanguageMessages
        : japaneseUsage / totalLanguageMessages;

      // Top Channels
      channels.sort((a, b) => b.count - a.count);
      const top3Channels = channels
        .slice(0, 3)
        .map(({ channelId, count }) => {
          const channel = server.guild.channels.cache.get(channelId);
          const percentage = formatPercent(count / totalMessages, 1);
          return `**${
            channel ? channelName(channel) : 'deleted-channel'
          }**: ${percentage}`;
        })
        .join('\n');

      // Top Emojis
      const top3Emojis = emojis
        .slice(0, 3)
        .map(({ emoji, count }) => {
          return `${resolveEmoji(emoji, bot)} ${pluralCount(
            'time',
            's',
            count
          )}`;
        })
        .join('\n');

      await message.channel.send(
        infoEmbed({
          authorIcon: member?.displayAvatarURL() || user?.displayAvatarURL(),
          authorName: `Stats for ${titleName}`,
          description: 'For the last 30 days',
          fields: [
            {
              name: 'Messages Month|Week',
              value: `${totalMessages} | ${weekMessages}`,
              inline: true,
            },
            showLanguageUsage
              ? {
                  name: isJapanese ? 'English Usage' : 'Japanese Usage',
                  value: formatPercent(languageUsage),
                  inline: true,
                }
              : null,
            {
              name: 'Time spent in VC',
              value: secondsToVcTime(voiceSeconds),
              inline: true,
            },
            {
              name: 'Deleted',
              value: formatPercent(deletes / (totalMessages || 1)),
              inline: true,
            },
            top3Channels
              ? {
                  name: 'Most active channels',
                  value: top3Channels,
                  inline: true,
                }
              : null,
            top3Emojis
              ? {
                  name: 'Most used emoji',
                  value: top3Emojis,
                  inline: true,
                }
              : null,
          ],
          footer: member
            ? 'Joined this server'
            : 'User no longer in the server',
          timestamp: member?.joinedTimestamp || undefined,
        })
      );
    }
  },
};

export default command;
