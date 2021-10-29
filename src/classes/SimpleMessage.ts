class SimpleMessage {
  id: string;
  del: boolean;
  a: string;
  atag: string;
  aid: string;
  apfp: string;
  con: string;
  acon: string;
  ch: string;
  chid: string;
  time: string;
  dur: string;
  img: string;
  constructor(arg: any) {
    if (arg.message) {
      const message = arg.message;
      this.id = message.id; // Message ID.
      this.del = arg.del;
      this.a = message.author.username; // Author username
      this.atag = message.author.tag; // Author username with the tag
      this.aid = message.author.id; // Author id
      this.apfp = message.author.avatarURL; // Author avatarURL
      this.con = this.del ? message.content : message.original; // Message content
      this.acon = this.del ? "" : message.content; // Message content after edit (only for edited messages)
      this.ch = message.channel.name; // Message channel name
      this.chid = message.channel.id; // Message channel id
      this.time = message.createdTimestamp; // Message time stamp
      this.dur = (
        new Date().getTime() / 1000 -
        message.createdTimestamp / 1000
      ).toFixed(1); // Message uptime duration in seconds
      this.img = ""; // ImageURL
    } else {
      const simple = arg.simple;
      this.id = simple.id;
      this.del = simple.del;
      this.a = simple.a;
      this.atag = simple.atag;
      this.aid = simple.aid;
      this.apfp = simple.apfp;
      this.con = simple.con;
      this.acon = simple.acon;
      this.ch = simple.ch;
      this.chid = simple.chid;
      this.time = simple.time;
      this.dur = simple.dur;
      this.img = simple.img;
    }
  }
}

export default SimpleMessage;
