const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const SimpleMsg = require('./SimpleMessage.js');
const BST = require('./BST.js');
const fs = require('fs');

// imgur setup
const imgur = require('imgur');
const config = require('../config.json');
imgur.setClientId(config.imgurID);
imgur.setAPIUrl('https://api.imgur.com/3/');
const imgurAlbum= config.imgurAlbum;
imgur.setCredentials(config.imgurEmail, config.imgurPass, config.imgurID);

module.exports = class Server {
    constructor(guild) {
      this.guild = guild;
      this.hiddenChannels = [];
      this.users = {};
      this.deletedMessages = [];
      this.today = 0;
      this.watchedUsers = {}; // surveillance
      this.newUsers = [];
      if (fs.existsSync(`./.${this.guild.id}_restore.json`)) {
        let json = JSON.parse(fs.readFileSync(`./.${this.guild.id}_restore.json`, 'utf8'));
        this.hiddenChannels = json['hiddenChannels'];
        this.today = json['today'];
        this.newUsers = json['newUsers'];
        for (var user in json['users']) {
          let uRec = json['users'][user]
          this.users[user] = new UserRecord(uRec['record'], uRec['thirty'],
            uRec['jp'], uRec['chans']); // TODO fix to new var names
        }
        for (var msg in json['deletedMessages']) {
          let dm = json['deletedMessages'][msg];
          this.deletedMessages.push(new SimpleMsg(dm.id, dm.del, dm.a, dm.atag, dm.aid, dm.apfp, dm.con, dm.acon, dm.ch, dm.chid, dm.time, dm.dur, dm.img));
        }
        for (var wu in json['watchedUsers']) {
          this.watchedUsers[wu] = [];
          let dms = json['watchedUsers'][wu];
          for (var i in dms) {
            let dm = json['watchedUsers'][wu][i];
            this.watchedUsers[wu].push(new SimpleMsg(dm.id, dm.del, dm.a, dm.atag, dm.aid, dm.apfp, dm.con, dm.acon, dm.ch, dm.chid, dm.time, dm.dur, dm.img));
          }
        }
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
      if (con.startsWith('.') || con.startsWith('t!') ||
        con.startsWith('!') || con.startsWith(':') ||
        con.startsWith('&') || con.startsWith(',')) return; // no bot messages
      var imageURL = '';
      if (message.attachments.size > 0) {
        imageURL = message.attachments.first().url;
        message.content += `\n{Attachment (expires soon): ${imageURL} }`;
      } else if (message.content.length < 3) {
        return;
      }
      let simple = new SimpleMsg(message);
      var arr;
      if (this.watchedUsers[message.author.id]) {
        arr = this.watchedUsers[message.author.id];
        if (imageURL != '') {
          imgur.uploadUrl(imageURL, config.imgurAlbum)
            .then(function (json) {
              simple.img = json.data.link;
            })
            .catch(function (err) {
              console.error(err.message);
            });
        }
      } else {
        arr = this.deletedMessages;
      }
      arr.push(simple);
      if (arr.length > 30) arr.shift();

      if (message.mentions.members.size > 20) { // spam alert!
        let chan = this.guild.channels.get('265319872378961920'); // #secrets_p
        if (chan == undefined) return;
        if (this.watchedUsers[message.author.id]) {
          message.member.addRole(`259181555803619329`); // muted role
          chan.send(`**USER MUTED** ${message.author} has been muted. <@&240647591770062848> if this was a mistake, unmute them by removing the mute tag. If not, BAN THEM!`);
        } else {
          this.watchedUsers[message.author.id] = [];
          chan.send(`**POSSIBLE SPAM ALERT** (deleting a message with 20+ mentions) by ${message.author} in ${message.channel} ! Automatically added to the watchlist`);
        }
      }
    }

    addEdits(oldMessage, newMessage) {
      if (this.watchedUsers.includes(oldMessage.author.id)) {
        let simple = new SimpleMsg(oldMessage);
        simple.acon = newMessage.content;
      }
    }

    addNewUser(memberID) {
      if (this.newUsers.unshift(memberID) > 3) this.newUsers.pop();
    }

    save(backup = false) {
      // Store the actual date?
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
