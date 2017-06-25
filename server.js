const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');

module.exports = class Server /*extends discord.Guild */{
  constructor(serverID) {
     //super();
     this.serverID = serverID;
     this.ignoredChannels = [];
     this.ignoredMembers  = [];
     this.users = {};
     this.today = 0;
   }

   getIgnoredChannels() {
     return this.ignoredChannels;
   }

   getIgnoredMembers() {
     return this.ignoredMembers;
   }

   ignoreChannel(channel) {
     this.ignoredChannels.push(channel);
   }

   ignoreMember(member) {
     this.ignoreMembers.push(member);
   }

   addMessage(message) {
     let author = message.author.id;
     let channel = message.channel.id;
     if (!this.users[author]) {
       this.users[author] = new UserRecord(author);
     }
     let userRec = this.users[author];
     userRec.add(channel, this.today);
   }

   leaderboard(message) {
     let result = {};
     for (var user in this.users) {
       result[user] = this.users[user].totalStats();
     }
     return result;
   }

   channelLeaderboard(message) {
     let result = {};
     for (var user in this.users) {
       result[user] = this.users[user].channelStats(message.channel.id);
     }
     return result;
   }
}
