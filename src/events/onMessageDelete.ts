import { BotEvent } from '@/types';
import { isNotDM } from '@utils/typeGuards';
import { dbInsertDeletes, dbInsertMessages } from '@database/statements';
import { getToday } from '@utils/formatStats';
import { DELETE_COLOR, EJLX, MAINICHI, MOD_LOG } from '@utils/constants';
import { getParentChannelId, getTextChannel } from '@utils/discordGetters';
import { makeEmbed } from '@utils/embed';
import { formatDuration, intervalToDuration } from 'date-fns';

const event: BotEvent<'messageDelete'> = {
  eventName: 'messageDelete',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!isNotDM(message)) return; // DM
    if (message.partial) return; // Partial message does not have author
    if (message.author.bot || message.system) return;
    if (/^(,,?,?|[.>\[$=+%&]|[tk]!|-h)[a-zA-Z]/.test(message.content)) return; // Bot commands
    const server = bot.servers[message.guild.id];
    const guildId = message.guild.id;
    const channelId = getParentChannelId(message.channel);
    const userId = message.author.id;
    if (!server.config.ignoredChannels.includes(channelId)) {
      dbInsertDeletes.run({
        guildId,
        userId,
        date: getToday(),
        deleteCount: 1,
      });
    }

    if (server.cache.watched.includes(userId)) {
      const modLog = getTextChannel(message.guild, server.config.modLogChannel);
      if (!modLog) return;

      // wait for potential images to be downloaded
      setTimeout(() => {
        if (message.attachments.size > 0) {
          message.attachments.forEach((attachment) => {});
        } else if (message.content.length <= 3) {
          // too short to care
          return;
        }
        const timeDiffMillis = new Date().getTime() - message.createdTimestamp;
        const channelName = server.guild.channels.cache.get(channelId)?.name;

        modLog.send(
          makeEmbed({
            color: DELETE_COLOR,
            authorName: `${message.author.tag} (${message.author})`,
            authorIcon: `${message.author.displayAvatarURL()}`,
            title: `Message Deleted after ${formatDuration(
              intervalToDuration({ start: 0, end: timeDiffMillis })
            )}`,
            description: message.content,
            footer: `#${channelName || 'unknown'}`,
            timestamp: true,
          })
        );
      }, 3000);
    }
  },
};

export default event;
