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

// Langex regex
const jpregex = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/;
const enregex = /[a-vx-zA-Z]|[Ａ-ＶＸ-Ｚａ-ｖｘ-ｚ]/;
const urlregex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;

// N5 kanji
const N5 = /[安一飲右雨駅円火花下何会外学間気九休魚金空月見言古五後午語校口行高国今左三山四子耳時七車社手週十出書女小少上食新人水生西川千先前足多大男中長天店電土東道読南日入年買白八半百父分聞母北木本毎万名目友来立六話]/;

const N4 = /[悪暗医意以引院員運英映遠屋音歌夏家画海回開界楽館漢寒顔帰起究急牛去強教京業近銀区計兄軽犬研県建験元工広考光好合黒菜作産紙思姉止市仕死使始試私字自事持室質写者借弱首主秋集習終住重春所暑場乗色森心親真進図青正声世赤夕切説洗早走送族村体太待貸台代題短知地池茶着昼注町鳥朝通弟低転田都度答冬頭同動堂働特肉売発飯病品不風服物文別勉便歩方妹味民明門問夜野薬有曜用洋理旅料力林]/;


module.exports = class Server {
    constructor(guild) {
      this.guild = guild;
      this.hiddenChannels = [];
      this.users = {};
      this.deletedMessages = [];
      this.today = 0;
      this.watchedUsers = []; // surveillance
      this.watchedImagesID = [];
      this.watchedImagesLink = [];
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
        this.watchedUsers = json['watchedUsers'];
        this.watchedImagesID = json['watchedImagesID'];
        this.watchedImagesLink = json['watchedImagesLink'];
        // for (var wu in json['watchedUsers']) {
          // Uncomment below for restoring them
          // let dms = json['watchedUsers'][wu];
          // for (var i in dms) {
          //   let dm = json['watchedUsers'][wu][i];
          //   this.watchedUsers[wu].push(new SimpleMsg(dm.id, dm.del, dm.a, dm.atag, dm.aid, dm.apfp, dm.con, dm.acon, dm.ch, dm.chid, dm.time, dm.dur, dm.img));
          // }
        //}
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

      if (message.channel.id == '376574779316109313') this.checkLanEx(message); // Check language exchange.
      if (message.channel.id == '208118574974238721') this.checkBegJp(message); // Check beginner jpn chat

      if (this.watchedUsers.indexOf(author) != -1) { // add images by watched users.
        if (message.attachments.size > 0) {
          let imageURL = message.attachments.first().url;
          // Use IMGUR
          var options = { method: 'POST',
            url: 'https://api.imgur.com/3/image',
            headers:
             {
               'cache-control': 'no-cache',
               authorization: `Bearer ${config.imgurAccessToken}`,
               'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
            formData: {image: imageURL, album: config.imgurAlbum, description: `In ${message.channel.name} by ${message.author.tag}`, type: 'URL'} };
          request(options, function (error, response, body) {
            if (error) console.log(error);
            var ret = JSON.parse(body);
            if (ret.data.link == undefined) {
              console.log(JSON.stringify(ret));
            } else {
              this.watchedImagesID.push(message.id);
              this.watchedImagesLink.push(ret.data.link);
              if (this.watchedImagesID.length > 50) {
                this.watchedImagesID.shift();
                this.watchedImagesLink.shift();
              }
            }
          }.bind(this));
        }
      }
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

    checkLanEx(message) {
      let japanese = message.member.roles.has('196765998706196480');
      let jpCount = 0;
      let enCount = 0;
      let keepIgnoring = false;
      let content = message.content.replace(urlregex, '');
      for (var i = 0; i < content.length; i++) {
        let l = content[i];
        if (l == '*' || l == '＊') return;
        if (keepIgnoring) {
          if (l == '>') {
            keepIgnoring = false;
          } else {
            continue;
          }
        } else if (l == '<') {
          keepIgnoring = true;
          i += 18; // skip snowflake id
          continue;
        }
        if (jpregex.test(l)) {
          jpCount++;
        } else if (enregex.test(l)) {
          enCount++;
        }
      }
      if ((japanese && jpCount * 1.5 > enCount) || (!japanese && enCount > jpCount * 1.5)) {
        message.react('🚫');
      }
    }

    checkBegJp(message) {
      let content = message.content.replace(urlregex, '');
      for (var i = 0; i < content.length; i++) {
        let l = content[i];
        if (/[\u4E00-\u9FAF]/.test(l) && !(N5.test(l) || N4.test(l))) {
          message.react('😣');
        }
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
        message.content += `\n{Attachment (expired): ${imageURL} }`;
      } else if (message.content.length < 3) {
        return;
      }
      var simple = new SimpleMsg(message);
      var arr;
      if (this.watchedUsers.includes(message.author.id)) {
        let timeout = 0;
        if (simple.dur < 5) {
          timeout = 5 - simple.dur * 1000;
        }
        setTimeout(function() {
          let index = this.watchedImagesID.indexOf(message.id);
          if (index != -1) {
            simple.img = this.watchedImagesLink[index];
          }
          this.postLogs(simple);
        }.bind(this), timeout);
      } else {
        arr = this.deletedMessages;
        // Move the next two outside of the brackets if you don't want to post.
        arr.push(simple);
        if (arr.length > 30) arr.shift();
      }
      if (message.mentions.members.size > 20) { // SPAM alert!
        let chan = this.guild.channels.get('366692441442615306'); // #mod_log
        if (chan == undefined) return;
        if (this.watchedUsers.includes(message.author.id)) {
          message.member.addRole(`259181555803619329`); // muted role
          chan.send(`**USER MUTED** ${message.author} has been muted. <@&240647591770062848> if this was a mistake, unmute them by removing the mute tag. If not, BAN THEM!`);
        } else {
          this.watchedUsers.push(message.author.id);
          chan.send(`**POSSIBLE SPAM ALERT** (deleting a message with 20+ mentions) by ${message.author} in ${message.channel} ! Automatically added to the watchlist`);
        }
      }
    }

    addEdits(oldMessage, newMessage) {
      if (this.watchedUsers.includes(oldMessage.author.id)) {
        let simple = new SimpleMsg(oldMessage);
        simple.del = false;
        simple.acon = newMessage.content;
        this.postLogs(simple);
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
      if (msg.img != '') { // if != null
        embed.addField('imgur link', msg.img, false);
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
