import { BotCommand } from '@/types';
import { getMessagesForUsers } from '@database/statements';
import { EJLX, WP } from '@utils/constants';
import { infoEmbed } from '@utils/embed';

const command: BotCommand = {
  name: 'welcomingParty',
  aliases: ['wp'],
  allowedServers: [EJLX],
  isAllowed: 'WP',
  description: 'Show Welcoming Party stats',
  normalCommand: async ({ message, server }) => {
    const wps = server.guild.members.cache.filter((m) => {
      return m.roles.cache.has(WP);
    });
    const wpIds = [...wps.keys()];
    const wpRanks = getMessagesForUsers({ guildId: server.guild.id }, wpIds);
    const hasRecord = wpRanks.map((wp) => wp.userId);
    let list = wpRanks
      .map(
        (wp) =>
          `<@${wp.userId}> (${
            server.guild.members.cache.get(wp.userId)?.user.tag
          }): ${wp.count} messages`
      )
      .join('\n');
    const zeroMessages = wpIds.filter((id) => !hasRecord.includes(id));
    list +=
      +'\n' +
      zeroMessages
        .map(
          (id) =>
            `<@${id}> (${
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
