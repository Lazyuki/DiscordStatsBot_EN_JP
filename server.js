const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const BST = require('./BST.js');
const fs = require('fs');

module.exports = class Server {
  constructor(server) {
     this.server = server;
     this.ignoredChannels = [];
     this.ignoredMembers  = [];
     this.users = {};
     this.today = 0;
     if (fs.existsSync('./.restore.json')) {
       let json = JSON.parse(fs.readFileSync('./.restore.json', 'utf8'));
       //this.server = json['server']['id'];
       this.ignoredChannels = json['ignoredChannels'];
       this.ignoredMembers = json['ignoredMembers'];
       this.today = json['today'];
       for (var user in json['users']) {
         let uRec = json['users'][user]
         this.users[user] = new UserRecord(uRec['record'], uRec['thirtyDays'],
                            uRec['channels']);
       }
     }
   }

   getHiddenChannels() {
     return this.ignoredChannels;
   }

   getIgnoredMembers() {
     return this.ignoredMembers;
   }

   hideChannel(channel) {
     this.ignoredChannels.push(channel);
   }

   ignoreMember(member) {
     this.ignoreMembers.push(member);
   }

   addMessage(message) {
     let author = message.author.id;
     let channel = message.channel.id;
     if (!this.users[author]) {
       this.users[author] = new UserRecord();
     }
     let userRec = this.users[author];
     userRec.add(channel, this.today);
   }

   save() {
     try {
       fs.writeFileSync('./.restore.json', JSON.stringify(this), 'utf8');
     } catch (e) {
       console.log(e);
     }
     console.log("./.restore.json has been updated");
   }
}
