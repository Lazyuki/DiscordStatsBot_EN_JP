const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');

module.exports = class Server /*extends discord.Guild */{
  constructor(serverID) {
     //super();
     this.serverID = serverID;
     this.ignoredChannels = [];
     this.ignoredMembers  = [];
     this.users = {};
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

   add(message) {
     let author = message.author.id;
     let channel = message.channel.id;
     if (!this.users[author]) {
       this.users[author] = new UserRecord(author);
     }
     let userRec = this.users[author];
     userRec.add(channel);
   }

   stat(message) {
     let ch = message.channel;
     let result = '';
     for (var user in this.users) {
       result += (user + " : " + this.users[user].total());
       result += '\n';
     }
     ch.send(result);
   }

}
