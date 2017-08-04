module.exports = class SimpleMessage {
  constructor(message) {
    this.id = message.id;
    this.author = message.author.username;
    this.author_id = message.author.id;
    this.content = message.content;
    this.channel = message.channel.name
    this.channel_id = message.channel.id;
    this.timestamp = message.createdTimestamp;
  }
}
