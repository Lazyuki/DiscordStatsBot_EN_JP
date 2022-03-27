import { BotCommand } from '@/types';
import { CommandArgumentError, MemberNotFoundError } from '@/errors';
import { getUserId, parseSnowflakeIds } from '@utils/argumentParsers';
import { stripIndent } from 'common-tags';
import { DMChannel, SnowflakeUtil, Util } from 'discord.js';
import { infoEmbed } from '@utils/embed';
import { getDiscordTimestamp } from '@utils/datetime';
import { resolveEmoji } from '@utils/formatString';

const command: BotCommand = {
  name: 'snowflake',
  aliases: ['id'],
  description: 'Show the Discord ID for an object and its creation time',
  arguments: '<ID | @user | @role | #channel | emoji | username>',
  examples: ['id @geralt', 'id 123456789123456789'],
  normalCommand: async ({ content, message, bot, server }) => {
    if (!content) {
      throw new CommandArgumentError('Please specify an ID');
    }

    const roleMention = message.mentions.roles.first();
    const channelMention = message.mentions.channels.first();
    const userMention = message.mentions.users.first();
    const memberMention = message.mentions.members?.first();
    let parsedId = '';
    let avatarUrl: string | undefined = undefined;
    let title = '';

    if (roleMention) {
      parsedId = roleMention.id;
      title = `Role @${roleMention.name}`;
    } else if (channelMention) {
      parsedId = channelMention.id;
      title = `Channel #${
        channelMention instanceof DMChannel || channelMention.partial
          ? 'unknown-channel'
          : channelMention.name
      }`;
    } else if (userMention || memberMention) {
      parsedId = memberMention?.id || userMention?.id!;
      title = `User @${memberMention?.user.tag || userMention?.tag}`;
      avatarUrl =
        memberMention?.displayAvatarURL() || userMention?.displayAvatarURL();
    } else {
      const { ids } = parseSnowflakeIds(content);
      if (ids.length) {
        parsedId = ids[0];
        if (server.guild.roles.cache.has(parsedId)) {
          title = `Role @${server.guild.roles.cache.get(parsedId)!.name}`;
        } else if (server.guild.channels.cache.has(parsedId)) {
          title = `Channel #${server.guild.channels.cache.get(parsedId)!.name}`;
        } else if (server.guild.members.cache.has(parsedId)) {
          const member = server.guild.members.cache.get(parsedId)!;
          title = `User @${member.user.tag}`;
          avatarUrl = member.displayAvatarURL();
        } else if (content.startsWith('<a:') || content.startsWith('<:')) {
          title = `Emoji ${resolveEmoji(content, bot)}`;
        } else {
          title = `Discord ID: ${parsedId}`;
        }
      } else {
        const memberId = getUserId(bot, server, content, true);
        if (!memberId) {
          throw new MemberNotFoundError(content);
        }
        const member = server.guild.members.cache.get(memberId)!;
        parsedId = memberId;
        title = `User @${member?.user.tag}`;
        avatarUrl = member.displayAvatarURL();
      }
    }
    const idDate = SnowflakeUtil.deconstruct(parsedId).date;
    await message.channel.send(
      infoEmbed({
        content: parsedId,
        title,
        authorIcon: avatarUrl,
        description: stripIndent`
        Snowflake: \`${parsedId}\`
        Unix Time in Seconds: \`${Math.floor(idDate.getTime() / 1000)}\`
        Your Local Time: ${getDiscordTimestamp(idDate, 'F')}
        `,
      })
    );
  },
};

export default command;
