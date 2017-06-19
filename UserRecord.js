module.exports = class UserRecord {
  constructor(name, id, channel_num) {
    this.name = name;
    this.id = id;
    this.channels = channel_num;
    this.record[][] = new [30][channel_num];
  }
};
