module.exports = class SimpleMessage {
  constructor(message, del, a, atag, aid, apfp, con, acon, chn, chid, time, dur, img) {
    if (arguments.length == 1) {
      this.id = message.id; // Message ID.
      this.del = true; // Deleted or edited message
      this.a = message.author.username; // Author username
      this.atag = message.author.tag; // Author username with the tag
      this.aid = message.author.id; // Author id
      this.apfp = message.author.avatarURL; // Author avatarURL
      this.con = message.content; // Message content
      this.acon = ''; // Message content after edit (only for edited messages)
      this.ch = message.channel.name; // Message channel name
      this.chid = message.channel.id; // Message channel id
      this.time = message.createdTimestamp; // Message time stamp
      this.dur = ((new Date()).getTime() / 1000 - this.time / 1000).toFixed(1); // Message uptime duration in seconds
      this.img = ''; // ImageURL
    } else if (arguments.length == 13) {
      this.id = message;
      this.del = del;
      this.a = a;
      this.atag = atag;
      this.aid = aid;
      this.apfp = apfp;
      this.con = con;
      this.acon = acon;
      this.ch = chn;
      this.chid = chid;
      this.time = time;
      this.dur = dur;
      this.img = img;
    }
  }
}
