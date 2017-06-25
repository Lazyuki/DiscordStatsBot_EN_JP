module.exports = class UserRecord {
  constructor(userID) {
    this.id = userID;
    this.record = new Array(31);
    this.thirtyDays = 0;
    this.channels = {};
  }

  // channelID in string, today is an int between 0-30
  add(channelID, today) {
    this.thirtyDays++;
    if (!this.record[today]) {
      this.record[today] = {};
      this.record[today][channelID] = 0;
    } else if (!this.record[today][channelID]) {
      this.record[today][channelID] = 0;
      if (!this.channels[channelID]) {
        this.channels[channelID] = 0;
      }
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
};
