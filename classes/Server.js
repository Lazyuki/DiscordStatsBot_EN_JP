const discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const SimpleMsg = require('./SimpleMessage.js');
const BST = require('./BST.js');
const fs = require('fs');

const http = require('http');


module.exports = class Server {
    constructor(guild) {
      this.guild = guild;
      this.hiddenChannels = [];
      this.users = {};
      this.deletedMessages = [];
      this.today = 0;
      this.watchedUsers = [];
      this.newUsers = [];
      if (fs.existsSync(`./.${this.guild.id}_restore.json`)) {
        let json = JSON.parse(fs.readFileSync(`./.${this.guild.id}_restore.json`, 'utf8'));
        this.hiddenChannels = json['hiddenChannels'];
        this.watchedUsers = json['watchedUsers'];
        this.today = json['today'];
        this.newUsers = json['newUsers'];
        for (var user in json['users']) {
          let uRec = json['users'][user]
          this.users[user] = new UserRecord(uRec['record'], uRec['thirty'],
            uRec['jp'], uRec['chans']); // TODO fix to new var names
        }
        for (var msg in json['deletedMessages']) {
          let dm = json['deletedMessages'][msg];
          this.deletedMessages.push(new SimpleMsg(dm.id, dm.a, dm.aid, dm.con, dm.ch, dm.chid, dm.time));
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
        message.content += `\n{Attachment (expires soon?): ${imageURL} }`;
      } else if (message.content.length < 3) {
        return;
      }
      if (this.watchedUsers.includes(message.author.id)) {
        let embed = new discord.RichEmbed();
        let msg = new SimpleMsg(message);
        let date = new Date(msg.time);
        let now = (new Date()).getTime() /1000;
        embed.setAuthor(`${msg.a} : <@${msg.aid}>` ,message.author.avatarURL);
        embed.title = `**Message Deleted** after ${now - date.getTime() / 1000} seconds`;
        embed.description = `${msg.con}`;
        embed.setFooter(`#${msg.ch}`)
        embed.timestamp = date;
        embed.color = Number('0xDB3C3C');
        if (imageURL != '') {
          embed.setImage(imageURL)
        }
        let chan = this.guild.channels.get('366692441442615306'); // #mod_log
        if (chan == undefined) return;
        chan.send({embed});
      } else {
        var arr = this.deletedMessages;
        arr.push(new SimpleMsg(message));
        if (arr.length > 50) arr.shift();
      }
    }

    addEdits(oldMessage, newMessage) {
      if (this.watchedUsers.includes(oldMessage.author.id)) {
        let embed = new discord.RichEmbed();
        let old = new SimpleMsg(oldMessage);
        let date = new Date(old.time);
        let now = (new Date()).getTime() / 1000;
        embed.setAuthor(`${old.a} : <@${old.aid}>`, oldMessage.author.avatarURL)
        embed.title = `**Message Edited** after ${now - date.getTime() / 1000} seconds`;
        embed.addField('Before:', `${old.con}`, false);
        embed.addField('After:', `${newMessage.content}`, false);
        embed.setFooter(`#${old.ch}`)
        embed.timestamp = date;
        embed.color = Number('0xff9933');
        let chan = this.guild.channels.get('366692441442615306'); // #mod_log
        if (chan == undefined) return;
        chan.send({embed});
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
