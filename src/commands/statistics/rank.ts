import { getUserId } from '@utils/argumentParsers';
import { BotCommand } from '@/types';
import { getLeaderboard, getVoiceLeaderboard } from '@database/statements';
import { infoEmbed } from '@utils/embed';
import { nth, pluralCount } from '@utils/pluralize';
import { secondsToVcTime } from '@utils/datetime';

const command: BotCommand = {
  name: 'rank',
  aliases: ['ranks'],
  description: 'Show your text and voice ranking in the server',
  arguments: '[@user]',
  requiredServerConfigs: ['statistics'],
  normalCommand: async ({ message, bot, server, content }) => {
    const text = getLeaderboard({
      guildId: server.guild.id,
    });
    const voice = getVoiceLeaderboard({
      guildId: server.guild.id,
    });
    let searchUserId = getUserId(bot, server, content);
    if (!searchUserId) {
      if (content) {
        await message.react('❓');
        return;
      }
      searchUserId = message.author.id;
    }
    const textIndex = text.findIndex((u) => u.userId === searchUserId);
    const voiceIndex = voice.findIndex((u) => u.userId === searchUserId);
    const textCount = textIndex === -1 ? 0 : text[textIndex].count;
    const voiceCount = voiceIndex === -1 ? 0 : voice[voiceIndex].count;
    const user = bot.users.cache.get(searchUserId);
    const member = server.guild.members.cache.get(searchUserId);
    const titleName = member
      ? member.displayName
      : user
      ? user.tag
      : `User <@${searchUserId}>`;
    await message.channel.send(
      infoEmbed({
        authorIcon: member?.displayAvatarURL() || user?.displayAvatarURL(),
        authorName: `Server Ranking for ${titleName}`,
        description: `\`\`\`\nText: ${nth(textIndex + 1)} (${pluralCount(
          'message',
          's',
          textCount
        )})\nVC:   ${nth(voiceIndex + 1)} (${secondsToVcTime(
          voiceCount
        )})\`\`\``,
      })
    );
  },
};

export default command;
