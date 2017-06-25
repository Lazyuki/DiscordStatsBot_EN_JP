const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const BST = require('./BST.js');
const fs = require('fs');

module.exports = class Server /*extends discord.Guild */{
  constructor(server) {
     //super();
     this.server = server;
     this.ignoredChannels = [];
     this.ignoredMembers  = [];
     this.users = {};
     if (fs.existsSync('./sample.json')) {
       let json = JSON.parse(fs.readFileSync('sample.json', 'utf8'));
       for (var user in json) {
         let uRec = json[user]
         this.users[user] = new UserRecord(uRec['record'], uRec['thirtyDays'],
                            uRec['channels']);
       }
     }
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
       this.users[author] = new UserRecord();
     }
     let userRec = this.users[author];
     userRec.add(channel, this.today);
   }

   leaderboard(message) {
     let result = new BST();
     for (var user in this.users) {
       let res = this.users[user].totalStats();
       if (res != 0) {
         result.add(user, res);
       }
     }
     return result.toMap();
   }

   channelLeaderboard(message, content, bot) {
     let result = new BST();
     let channel = content == '' ? message.channel.id : content;
     //let chan = this.server.channels[content];
     for (var user in this.users) {
       //if (!(await chan.permissionsFor(user)).has('SEND_MESSAGES')) continue;
       let res = this.users[user].channelStats(channel);
       if (res != 0) {
         result.add(user, res);
       }
     }
     return result.toMap();
   }

   save() {
     fs.writeFile("./sample.json", JSON.stringify(this.users), (err) => {
       if (err) {
          console.error(err);
          return;
       };
       console.log("File has been created");
     });
   }
}
