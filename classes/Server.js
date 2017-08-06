const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const SimpleMsg = require('./SimpleMessage.js');
const BST = require('./BST.js');
const fs = require('fs');

module.exports = class Server {
  constructor(guild) {
     this.guild = guild;
     this.hiddenChannels = [];
     this.users = {};
     this.deletedMessages = [];
     this.today = 0;
     if (fs.existsSync(`./.${this.guild.id}_restore.json`)) {
       let json = JSON.parse(fs.readFileSync(`./.${this.guild.id}_restore.json`, 'utf8'));
       this.hiddenChannels = json['hiddenChannels'];
       this.today = json['today'];
       for (var user in json['users']) {
         let uRec = json['users'][user]
         this.users[user] = new UserRecord(uRec['record'], uRec['thirty'],
                                               uRec['jp'], uRec['chans']); // TODO fix to new var names
       }
      //  for (var dm in json['deletedMessages']) {
      //    this.deletedMessages.push(new SimpleMsg(dm.id, dm.a, dm.aid, dm.con, dm.ch, dm.chid, dm.time));
      //  }
     }
   }

   hideChannel(channel) {
     if (this.hiddenChannels.includes(channel)) return;
     this.hiddenChannels.push(channel);
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

   addDeletedMessage(message) {
     let con = message.content;
     if (message.content.length < 5) return; // don't log short messages
     if (con.startsWith('.') || con.startsWith('t!')
         || con.startsWith('!') || con.startsWith(':')
         || con.startsWith('&')) return;  // no bot messages
     let arr = this.deletedMessages;
     arr.push(new SimpleMsg(message));
     if (arr.length > 50) arr.shift();
   }

   save(backup=false) {
     if (backup) {
       var date = new Date().toLocaleDateString().replace(/\//g, '-');
       try {
         fs.writeFileSync(`./backups/${this.guild.id}_log-${date}.json`, JSON.stringify(this), 'utf8');
       } catch (e) {
         console.log(e);
       }
       console.log(`Backup has been created for ${this.guild.id}: ${date}`);
     } else {
       try {
         fs.writeFileSync(`./.${this.guild.id}_restore.json`, JSON.stringify(this), 'utf8');
       } catch (e) {
         console.log(e);
       }
       // console.log(`./.${this.guild.id}_restore.json has been updated`);
     }
   }
}
