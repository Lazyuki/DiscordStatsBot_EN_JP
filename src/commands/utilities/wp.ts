import { BotCommand } from 'types';
import { WP } from 'utils/constants';

const command: BotCommand = {
  isAllowed: 'WP',
  description: 'Welcoming Party stats',
  examples: ['{PF}wp'],
  normalCommand: async ({ message, server }) => {
    const wps = server.guild.members.cache.filter((m) => {
      return m.roles.cache.has(WP);
    });
    const wpMessages = [];
    // for (const [wp, id] of wps) {
    //   if (server.users[id]) {
    //     str += `${wp.user.tag} : ${server.users[id].thirty}\n`;
    //   } else {
    //     str += `${wp.user.tag} : 0\n`;
    //   }
    // }
    // message.channel.send(str);
  },
};

export default command;
