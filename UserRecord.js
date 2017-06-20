module.exports = class UserRecord {
  constructor(userID) {
    this.id = userID;
    this.record = new Array(31);
  }

  add(channelID) {
    debugger;
    let today = new Date().getDate() - 1; // -1 for array indexing
    if (this.record[today] == undefined) {
      this.record[today] = {};
      this.record[today][channelID] = 0;
      console.log(this.record[today][channelID]);
    }
    console.log(this.record[today][channelID]);
    this.record[today][channelID]++;
  }

  total() {
    let count = 0;
    this.record.forEach(function(day) {
      if (day == undefined) return;
      for (var ch in day) {
        count += day[ch];
      }
    });
    return count;
  }
};
