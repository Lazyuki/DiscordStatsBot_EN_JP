import { BotEvent, GuildMessage } from '@/types';
import checkSafeMessage from '@utils/checkSafeMessage';
import { ACTIVE_STAFF } from '@utils/constants';
import axios from 'axios';

const event: BotEvent<'messageCreate'> = {
  eventName: 'messageCreate',
  skipOnDebug: true,
  processEvent: async (bot, message) => {
    if (!checkSafeMessage(bot, message)) {
      if (!message.author.bot) return; // Still listened to bot messages
    }
    const userMentions = message.mentions.users;
    const roleMentions = message.mentions.roles;

    if (userMentions.size === 0 || roleMentions.size === 0) return;
    if (!bot.config.lineNotify) return;
    const userIds = Object.keys(bot.config.lineNotify);
    const hasActiveStaff = roleMentions.has(ACTIVE_STAFF);
    const notifyTokens: string[] = [];
    if (userMentions.hasAny(...userIds) || hasActiveStaff) {
      for (const [userId, lineNotify] of Object.entries(
        bot.config.lineNotify
      )) {
        const member = message.guild?.members.cache.get(userId);
        if (!member) continue;
        const isOffline = member.presence?.status === 'offline';
        const noActiveStaffRole = !member.roles.cache.has(ACTIVE_STAFF);
        if (hasActiveStaff) {
          const activeStaffConfig = lineNotify.activeStaff;
          if (
            activeStaffConfig === 'ALWAYS' ||
            (isOffline && activeStaffConfig.includes('OFFLINE')) ||
            (noActiveStaffRole && activeStaffConfig === 'OFFLINE_NOROLE')
          ) {
            notifyTokens.push(lineNotify.lineNotifyToken);
            continue;
          }
        } else if (userMentions.has(userId)) {
          const userMentionConfig = lineNotify.userMention;
          if (
            userMentionConfig === 'ALWAYS' ||
            (isOffline && userMentionConfig === 'OFFLINE')
          ) {
            notifyTokens.push(lineNotify.lineNotifyToken);
          }
        }
      }
    }
    if (notifyTokens.length) {
      await postLINE(message as GuildMessage, notifyTokens);
    }
  },
};

async function postLINE(message: GuildMessage, tokens: string[]) {
  const embedDescription = message.embeds.length
    ? message.embeds[0].description || message.embeds[0].title || ''
    : '';
  await Promise.all(
    tokens.map(
      async (token) =>
        await axios.post(
          'https://notify-api.line.me/api/notify',
          {
            message: `#${message.channel.name}\n${message.author.username}:\n${message.cleanContent}\n${embedDescription}`,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              'content-type':
                'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
            },
          }
        )
    )
  );
}

export default event;
