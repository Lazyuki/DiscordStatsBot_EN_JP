const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const BST = require('./BST.js');
const fs = require('fs');

module.exports = class Server {
  constructor(serverID) {
     this.server = serverID;
     this.ignoredChannels = [];
     this.ignoredMembers  = [];
     this.users = {};
     this.today = 0;
     if (fs.existsSync('./.restore.json')) {
       let json = JSON.parse(fs.readFileSync('./.restore.json', 'utf8'));
       this.server = json['server'];
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

   save(bot) {
     fs.writeFileSync("./.restore.json", JSON.stringify(this), (err) => {
       if (err) {
          console.error(err);
          return;
       };
       console.log("./.restore.json has been updated");
     });
     fs.writeFileSync("./server.json", JSON.stringify(bot.guilds.get('189571157446492161')), (err) => {
       if (err) {
          console.error(err);
          return;
       };
       console.log("server has been updated");
     });
   }
}
