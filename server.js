const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const BST = require('./BST.js');
const fs = require('fs');

module.exports = class Server {
  constructor(guild) {
     this.guild = guild;
     this.hiddenChannels = [];
     this.ignoredMembers  = [];
     this.users = {};
     this.deletedMessages = [];
     this.today = 0;
     if (fs.existsSync('./.restore.json')) {
       let json = JSON.parse(fs.readFileSync('./.restore.json', 'utf8'));
       //this.server = json['server']['id'];
       this.hiddenChannels = json['hiddenChannels'];
       this.ignoredMembers = json['ignoredMembers'];
       this.deletedMessages = json['deletedMessages'];
       this.today = json['today'];
       for (var user in json['users']) {
         let uRec = json['users'][user]
         this.users[user] = new UserRecord(uRec['record'], uRec['thirtyDays'],
                            uRec['japanese'], uRec['channels']);
       }
     }
   }

   hideChannel(channel) {
     this.hiddenChannels.push(channel);
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
     userRec.add(message.content, channel, this.today);
   }

   save(backup=false) {
     if (backup) {
       var date = new Date().toLocaleDateString().replace(/\//g, '-');
       try {
         fs.writeFileSync(`./backups/log-${date}.json`, JSON.stringify(this), 'utf8');
       } catch (e) {
         console.log(e);
       }
       console.log(`Backup has been created: ${date}`);
     } else {
       try {
         fs.writeFileSync('./.restore.json', JSON.stringify(this), 'utf8');
       } catch (e) {
         console.log(e);
       }
       console.log("./.restore.json has been updated");
     }
   }
}
