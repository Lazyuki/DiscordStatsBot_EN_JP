import { Message } from 'discord.js';
import Server from '../classes/Server';
import { Bot } from '../types';

export const searchUser = (
  message: Message,
  content: string,
  server: Server,
  bot: Bot
) => {
  const mentions = message.mentions.users;
  if (mentions.size !== 0) {
    // Get mention
    return mentions.first();
  } else if (content) {
    // search name
    const regex = content[0] === '*';
    // if (regex) {
    //   const r = new RegExp(content.substr(1, content.length), 'i');
    //   for (const id in server.users) {
    //     const u = server.guild.members.cache.get(id); // TODO change to fetch?
    //     if (u == undefined) continue; // if left
    //     if (r.test(u.user.tag) || r.test(u.nickname)) {
    //       return u.user;
    //     }
    //   }
    //   for (let [, mem] of server.guild.members.cache) {
    //     if (r.test(mem.user.tag) || r.test(mem.nickname)) {
    //       return mem.user;
    //     }
    //   }
    // } else {
    //   content = content.toLowerCase();
    //   for (let id in server.users) {
    //     let u = server.guild.members.cache.get(id);
    //     if (id == content) {
    //       return bot.users.fetch(id); // This returns a Promise
    //     }
    //     if (u == undefined) continue; // user left
    //     if (
    //       u.user.tag.toLowerCase().startsWith(content) ||
    //       (u.nickname && u.nickname.toLowerCase().startsWith(content))
    //     ) {
    //       return u.user;
    //     }
    //   }
    //   for (const [id, mem] of server.guild.members.cache) {
    //     if (id === content) {
    //       return mem.user;
    //     }
    //     if (
    //       mem.user.tag.toLowerCase().startsWith(content) ||
    //       (mem.nickname && mem.nickname.toLowerCase().startsWith(content))
    //     ) {
    //       return mem.user;
    //     }
    //   }
    // }
  }
  return null;
};
