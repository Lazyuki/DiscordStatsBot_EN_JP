const Discord = require('discord.js');
const UserRecord = require('./UserRecord.js');
const SimpleMsg = require('./SimpleMessage.js');
const BST = require('./BST.js');
const LINE = require('@line/bot-sdk');
const fs = require('fs');

// imgur setup
const config = require('../config.json');
const request = require('request');

// LINE setup
const LINEclient = new LINE.Client({
  channelAccessToken: config.LINEchannelAccessToken
});

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
          // Uncomment below for restoring them
          // let dms = json['watchedUsers'][wu];
          // for (var i in dms) {
          //   let dm = json['watchedUsers'][wu][i];
          //   this.watchedUsers[wu].push(new SimpleMsg(dm.id, dm.del, dm.a, dm.atag, dm.aid, dm.apfp, dm.con, dm.acon, dm.ch, dm.chid, dm.time, dm.dur, dm.img));
          // }
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

      // Notify via LINE
      if (message.mentions.users.has(config.owner_ID) || message.mentions.roles.has('240647591770062848')) {
        this.guild.fetchMember(config.owner_ID)
          .then((member) => {
            if (member.presence.status != 'offline') return; // if I'm offline
            if (message.content.startsWith('t!')) return; // ignore tatsumaki
            const LINEmsg = [];
            LINEmsg.push({
              type: 'text',
              text: `${message.cleanContent}`
            });
            LINEmsg.push({
              type: 'text',
              text: `In #${message.channel.name} by ${message.author.username}`
            });
            LINEclient.pushMessage(config.LINEuserID, LINEmsg)
            .catch((err) => {
              throw new Error(err);
            });
          });
      }
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
        // arr = this.watchedUsers[message.author.id];
        if (imageURL != '') {
          // Use IMGUR
          var options = { method: 'POST',
            url: 'https://api.imgur.com/3/image',
            headers:
             {
               'cache-control': 'no-cache',
               authorization: `Bearer ${config.imgurAccessToken}`,
               'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
            formData: {image: imageURL, album: config.imgurAlbum } };
          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            var ret = JSON.parse(body);
            simple.img =  ret.data.link;
          });
        }
        postLogs(simple);
      } else {
        arr = this.deletedMessages;
        // Move the next two outside of the brackets if you don't want to post.
        arr.push(simple);
        if (arr.length > 30) arr.shift();
      }
      if (message.mentions.members.size > 20) { // SPAM alert!
        let chan = this.guild.channels.get('366692441442615306'); // #mod_log
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
      if (this.watchedUsers[oldMessage.author.id]) {
        let simple = new SimpleMsg(oldMessage);
        simple.del = false;
        simple.acon = newMessage.content;
        postLogs(simple);
        // Uncomment below for storing messages
        // this.watchedUsers[oldMessage.author.id].push(simple);
        // if (this.watchedUsers[oldMessage.author.id].length > 30) this.watchedUsers[oldMessage.author.id].shift();
      }
    }

    postLogs(msg) {
      let embed = new Discord.RichEmbed();
      let date = new Date(msg.time);
      embed.setAuthor(`${msg.atag} ID: ${msg.aid}` ,msg.apfp);
      if (msg.del) { // message was deleted
        embed.title = `Message Deleted after ${msg.dur} seconds`;
        embed.description = `${msg.con}`;
        embed.color = Number('0xDB3C3C');
      } else { // message was edited
        embed.title = `Message Edited after ${msg.dur} seconds`;
        embed.addField('Before:', `${msg.con}`, false);
        embed.addField('After:', `${msg.acon}`, false);
        embed.color = Number('0xff9933');
      }
      embed.setFooter(`#${msg.ch}`)
      embed.timestamp = date;
      if (msg.img) { // if != null
        embed.setImage(msg.img);
      }
      let chan = this.guild.channels.get('366692441442615306'); // #mod_log
      if (chan == undefined) return;
      chan.send({embed});
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
