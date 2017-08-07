module.exports = class SimpleMessage {
  constructor(message, a, aid, con, chn, chid, time) {
    if (arguments.length == 1) {
      this.id = message.id;
      this.a = message.author.username; // Author username
      this.aid = message.author.id; // Author id
      this.con = message.content; // Message content
      this.ch = message.channel.name; // Message channel name
      this.chid = message.channel.id; // Message channel id
      this.time = message.createdTimestamp; // Message time stamp
    } else if (arguments.length == 7) {
      this.id = message;
      this.a = a;
      this.aid = aid;
      this.con = con;
      this.ch = chn;
      this.chid = chid;
      this.time = time;
    }
  }
}
