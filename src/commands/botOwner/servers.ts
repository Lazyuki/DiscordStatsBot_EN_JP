import { BotCommand } from '@/types';
import { stripIndent } from 'common-tags';
import { EmbedField } from '@utils/embed';
import { fieldsPaginator } from '@utils/paginate';
import { userToMentionAndTag } from '@utils/formatString';
import { getDiscordTimestamp } from '@utils/datetime';
import { getActiveUserMessages } from '@database/statements';

const command: BotCommand = {
  name: 'servers',
  isAllowed: ['BOT_OWNER'],
  description: 'List servers the bot is in',
  options: [
    {
      name: 'threshold',
      short: 'n',
      description: 'Minimum number of messages to consider active',
      bool: false,
    },
  ],
  examples: ['servers', 'servers -n 100'],
  normalCommand: async ({ options, message, bot }) => {
    const servers = Object.values(bot.servers);
    const serverData: EmbedField[] = [];
    const threshold = parseInt((options['threshold'] as string) || '0', 10);
    for (const server of servers) {
      const guild = server.guild;
      const owner = guild.members.cache.get(guild.ownerId);
      const userMessages = getActiveUserMessages({
        guildId: server.guild.id,
        threshold,
      });
      serverData.push({
        name: guild.name,
        value: stripIndent`
        Server ID: \`${guild.id}\`
        Server Owner: ${owner ? userToMentionAndTag(owner.user) : 'None'}
        Added: ${getDiscordTimestamp(server.guild.members.me!.joinedAt!, 'R')}
        Total Members: \`${guild.memberCount}\`
        Active Members: \`${userMessages.length}\`
        Statistics Enabled: \`${server.config.statistics ? 'true' : 'false'}\`

        `,
        inline: false,
      });
    }
    await fieldsPaginator(
      message.channel,
      'Servers',
      `${servers.length} servers. Active member message threshold: \`${threshold}\``,
      serverData,
      false,
      -1,
      message.author.id
    );
  },
};

export default command;
