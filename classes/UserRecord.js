const Util = require('./Util.js');

module.exports = class UserRecord {
  constructor(arg) {
    if (arg) { // build from backup
      this.record = arg.record;
      this.thirty = arg.thirty;
      this.jp = arg.jp;
      this.en = arg.en;
      this.vc = arg.vc; // ? arg.vc : 0;
      this.chans = arg.chans;
      this.rxn = arg.rxn ? arg.rxn : {};
    } else { // build from scratch
      this.record = new Array(31); //31 days
      this.thirty = 0;
      this.jp = 0;
      this.en = 0;
      this.vc = 0;
      this.chans = {}; // {<channel ID>: # messages, <ID>: #}
      this.rxn = {};
    }
  }

  // channelID in string, today is an int between 0-30
  add(content, channelID, today) {
    this.thirty++;
    let lang = Util.lang(content, false);
    if (!this.record[today]) {
      this.record[today] = {};
      this.record[today][channelID] = 0;
    } else if (!this.record[today][channelID]) {
      this.record[today][channelID] = 0;
    }
    if (!this.chans[channelID]) {
      this.chans[channelID] = 0;
    }
    if (lang & Util.LANG.JPN) { // is Japanese
      if (!this.record[today]['jpn']) {
        this.record[today]['jpn'] = 0;
      }
      this.record[today]['jpn']++;
      this.jp++;
    } else if (lang & Util.LANG.ENG) {
      if (!this.record[today]['eng']) {
        this.record[today]['eng'] = 0;
      }
      this.record[today]['eng']++;
      this.en++;
    }
    this.chans[channelID]++;
    this.record[today][channelID]++;
  }

  addReacts(reaction, today) {
    if (!this.record[today]) {
      this.record[today] = {};
      this.record[today]['rxn'] = {};
    } else if (!this.record[today]['rxn']) {
      this.record[today]['rxn'] = {};
    }
    if (!this.record[today]['rxn'][reaction]) {
      this.record[today]['rxn'][reaction] = 0;
    }
    this.record[today]['rxn'][reaction]++;
    if (this.rxn[reaction]) {
      this.rxn[reaction]++;
    } else {
      this.rxn[reaction] = 1;
    }
  }
  removeReacts(reaction, today) {
    if (!this.record[today] || !this.record[today]['rxn']) return;
    if (!this.record[today]['rxn'][reaction]) return;
    this.record[today]['rxn'][reaction]--;
    if (this.rxn[reaction]) {
      this.rxn[reaction]--;
    }
  }

  addVoiceTime(today, ms) {
    if (!this.record[today]) {
      this.record[today] = {};
    }
    if (!this.record[today]['vc']) {
      this.record[today]['vc'] = 0;
    }
    let min = Math.round(ms / 60000);
    this.record[today]['vc'] += min;
    this.vc += min;
  }

  totalStats() {
    return this.thirty;
  }

  voiceTime() {
    return this.vc; 
  }

  totalReactions() {
    return this.rxn;
  }

  channelStats(channelID) {
    let result = this.chans[channelID];
    return result ? result : 0;
  }

  // Cleans up the old messages.
  // Returns true if this user hasn't spoken in the last 30 days.
  adjust(today) {
    let earliestDay = (today) % 31; // (today - 1) % 30?
    for (var chan in this.record[earliestDay]) {
      if (chan == 'jpn') {
        this.jp -= this.record[earliestDay]['jpn'];
        delete this.record[earliestDay]['jpn'];
        continue;
      }
      if (chan == 'eng') {
        this.en -= this.record[earliestDay]['eng'];
        delete this.record[earliestDay]['eng'];
        continue;
      }
      if (chan == 'rxn') { // reactions
        let reactions = this.record[earliestDay]['rxn'];
        for (let r in reactions) {
          this.rxn[r] -= reactions[r];
          if (this.rxn[r] <= 0) delete this.rxn[r];
        }
        delete this.record[earliestDay]['rxn'];
        continue;
      }
      if (chan == 'vc') { // voice
        this.vc -= this.record[earliestDay]['vc'];
        delete this.record[earliestDay]['vc'];
        continue;
      }
      let num = this.record[earliestDay][chan];
      this.chans[chan] -= num;
      if (this.chans[chan] <= 0) {
        delete this.chans[chan]; // if the user hasn't spoken in this channel
      }
      this.thirty -= num;
      delete this.record[earliestDay][chan];

    }
    //this.record[earliestDay] == {};
    return this.thirty <= 0 && this.vc <= 0;
  }
};
