module.exports = class UserRecord {
  constructor(record, thirtyDays, channels) {
    if (arguments.length != 3) {
      this.record = new Array(31);
      this.thirtyDays = 0;
      this.channels = {}; // {<channel ID>: # messages, <ID>: #}
    } else {
      this.record = record;
      this.thirtyDays = thirtyDays;
      this.channels = channels;
    }
  }

  // channelID in string, today is an int between 0-30
  add(channelID, today) {
    this.thirtyDays++;
    if (!this.record[today]) {
      this.record[today] = {};
      this.record[today][channelID] = 0;
    } else if (!this.record[today][channelID]) {
      this.record[today][channelID] = 0;
    }
    if (!this.channels[channelID]) {
      this.channels[channelID] = 0;
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
      let num = this.record[earliestDay][chan];
      this.channels[chan] -= num;
      this.thirtyDays -= num;
      this.record[earliestDay][chan] = 0;
    }
    return this.thirtyDays == 0;
  }
};
