const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');

module.exports = class Server extends discord.Guild {
  constructor() {
       super();
       this.ignoredChannels = [];
       this.ignoredMembers  = [];

   }

   get ignoredChannels() {
     return this.ignoredChannels;
   }

   get ignoredMembers() {
     return this.ignoredMembers;
   }

   ignoreChannel(channel) {
     this.ignoredChannels
   }

   ignoreMember(member) {
     this.ignoreMembers
   }



}
