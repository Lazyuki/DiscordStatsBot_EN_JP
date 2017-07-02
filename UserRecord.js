// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF00-FFEF : Full-width roman + half-width katakana
// 4E00-9FAF : Common and uncommon kanji
const regex = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]/g;
//
module.exports = class UserRecord {
  constructor(record, thirtyDays, japanese, channels) {
    if (arguments.length != 4) { // build from scratch
      this.record = new Array(31); // TODO zero-out?
      this.thirtyDays = 0;
      this.japanese = 0;
      this.channels = {}; // {<channel ID>: # messages, <ID>: #}
    } else { // build from backup
      this.record = record;
      this.thirtyDays = thirtyDays;
      this.japanese = 0;
      this.channels = channels;
    }
  }

  // channelID in string, today is an int between 0-30
  add(content, channelID, today) {
    this.thirtyDays++;
    let jp = regex.test(content); //
    if (!this.record[today]) {
      this.record[today] = {};
      this.record[today][channelID] = 0;
    } else if (!this.record[today][channelID]) {
      this.record[today][channelID] = 0;
    }
    if (!this.channels[channelID]) {
      this.channels[channelID] = 0;
    }
    if (jp) { // contains some Japanese characters
      if (!this.record[today]['jpn']) {
        this.record[today]['jpn'] = 0;
      } else {
        this.record[today]['jpn']++;
      }
      this.japanese++;
    }
    this.channels[channelID]++;
    this.record[today][channelID]++;
  }

  totalStats() {
    return this.thirtyDays;
  }

  channelStats(channelID) {
    let result = this.channels[channelID];
    return result ? result : 0;
  }

  // Cleans up the old messages.
  // Returns true if this user hasn't spoken in the last 30 days.
  adjust(today) {
    let earliestDay = (today) % 31; // (today - 1) % 30?
    for (var chan in this.record[earliestDay]) {
      if (chan == 'jpn') {
        this.japanese -= this.record[earliestDay]['jpn'];
        continue;
      }
      let num = this.record[earliestDay][chan];
      this.channels[chan] -= num;
      this.thirtyDays -= num;
      this.record[earliestDay][chan] = 0;
    }
    return this.thirtyDays == 0;
  }
};
