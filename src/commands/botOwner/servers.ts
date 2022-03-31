import { makeEmbed, successEmbed } from '@utils/embed';
import { BotCommand } from '@/types';
import { stripIndent } from 'common-tags';
import { EmbedField } from '@utils/embed';
import { fieldsPaginator } from '@utils/paginate';
import { userToMentionAndTag } from '@utils/formatString';

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
      serverData.push({
        name: guild.name,
        value: stripIndent`
        Server ID: \`${guild.id}\`
        Server Owner: ${owner ? userToMentionAndTag(owner.user) : 'None'}
        Total Members: \`${guild.memberCount}\`
        Statistics Enabled: \`${server.config.statistics ? 'true' : 'false'}\`
        `,
        inline: false,
      });
    }
    await fieldsPaginator(
      message.channel,
      'Servers',
      `${servers.length} servers`,
      serverData,
      false,
      -1,
      message.author.id
    );
  },
};

export default command;
