import { BotCommand } from '@/types';
import { getMessagesForUsers } from '@database/statements';
import { EJLX, WP } from '@utils/constants';
import { infoEmbed } from '@utils/embed';
import { idToUser } from '@utils/guildUtils';
import { pluralCount } from '@utils/pluralize';

const command: BotCommand = {
  name: 'welcomingParty',
  aliases: ['wp'],
  allowedServers: [EJLX],
  isAllowed: ['WP'],
  description: 'Show Welcoming Party stats',
  normalCommand: async ({ message, server }) => {
    const wps = server.guild.members.cache.filter((m) => {
      return m.roles.cache.has(WP);
    });
    const wpIds = [...wps.keys()];
    const wpRanks = getMessagesForUsers({ guildId: server.guild.id }, wpIds);
    const hasRecord = wpRanks.map((wp) => wp.userId);
    let list =
      wpRanks
        .map(
          (wp) =>
            `${idToUser(wp.userId)}> (${
              server.guild.members.cache.get(wp.userId)?.user.tag
            }): ${pluralCount('message', 's', wp.count)}`
        )
        .join('\n') + '\n';
    const zeroMessages = wpIds.filter((id) => !hasRecord.includes(id));
    list += zeroMessages
      .map(
        (id) =>
          `${idToUser(id)} (${
            server.guild.members.cache.get(id)?.user.tag
          }): 0 messages`
      )
      .join('\n');
    await message.channel.send(
      infoEmbed({
        title: 'Welcoming Party Stats',
        description: list,
      })
    );
  },
};

export default command;
