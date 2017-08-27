// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF66-FF9D : half-width katakana
// 4E00-9FAF : common and uncommon kanji
const regex = /[\u3040-\u30FF]|[\uFF66-\uFF9D]|[\u4E00-\u9FAF]/g;

// /^(?:<:[^:]+:\d+>|:[^:]+:)$/.test(message.content)
// example <:turboRAGE:312737141509586945> 📠

//
module.exports = class UserRecord {
  constructor(record, thirty, jp, chans) {
    if (arguments.length != 4) { // build from scratch
      this.record = new Array(31); //31 days
      this.thirty = 0;
      this.jp = 0;
      this.chans = {}; // {<channel ID>: # messages, <ID>: #}
    } else { // build from backup
      this.record = record;
      this.thirty = thirty;
      this.jp = jp;
      this.chans = chans;
    }
  }

  // channelID in string, today is an int between 0-30
  add(content, channelID, today) {
    this.thirty++;
    let jp = regex.test(content); //
    if (!this.record[today]) {
      this.record[today] = {};
      this.record[today][channelID] = 0;
    } else if (!this.record[today][channelID]) {
      this.record[today][channelID] = 0;
    }
    if (!this.chans[channelID]) {
      this.chans[channelID] = 0;
    }
    if (jp) { // contains some jp characters
      if (!this.record[today]['jpn']) {
        this.record[today]['jpn'] = 0;
      }
      this.record[today]['jpn']++;
      this.jp++;
    }
    this.chans[channelID]++;
    this.record[today][channelID]++;
  }

  addReacts(today) {
    if (!this.record[today]['rxn']) {
      this.record[today]['rxn'] = 0;
    }
    this.record[today]['rxn']++;
  }

  totalStats() {
    return this.thirty;
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
        this.record[earliestDay]['jpn'] = 0;
        continue;
      }
      if (chan == 'rxn') { // reactions
        this.rxn -= this.record[earliestDay]['rxn'];
        this.record[earliestDay]['rxn'] = 0;
        continue;
      }
      let num = this.record[earliestDay][chan];
      this.chans[chan] -= num;
      if (this.chans[chan] == 0) {
        delete this.chans[chan]; // if the user hasn't spoken in this channel
      }
      this.thirty -= num;
      this.record[earliestDay][chan] = 0;
    }
    return this.thirty == 0;
  }
};
