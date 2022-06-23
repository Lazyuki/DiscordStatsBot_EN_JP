import { ServerData, BotEvent } from '@/types';

declare module '@/types' {
  interface ServerData {
    forumFollowers: Record<string, string[]>; // Forum ID, userIDs
  }
}

const threadCreate: BotEvent<'threadCreate'> = {
  eventName: 'threadCreate',
  skipOnDebug: true,
  onServerInit: (server) => {
    server.data.forumFollowers ||= {};
  },
  processEvent: async (bot, thread, newlyCreated) => {
    const server = bot.servers[thread.guild.id];
    const forumId = thread.parentId;
    if (forumId && server.data.forumFollowers[forumId] && newlyCreated) {
      server.data.forumFollowers[forumId].forEach((userId) => {
        thread.members.add(userId, 'forum follower');
      });
    }
  },
};

const userLeave: BotEvent<'guildMemberRemove'> = {
  eventName: 'guildMemberRemove',
  skipOnDebug: false,
  processEvent: async (bot, member) => {
    const server = bot.servers[member.guild.id];
    Object.entries(server.data.forumFollowers).forEach(([forumId, userIds]) => {
      const index = userIds.findIndex((id) => id === member.id);
      if (index >= 0) {
        userIds.splice(index, 1);
      }
      if (userIds.length === 0) {
        delete server.data.forumFollowers[forumId];
      }
    });
  },
};

export default [threadCreate, userLeave];
