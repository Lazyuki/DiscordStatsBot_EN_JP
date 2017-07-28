module.exports = class SimpleMessage {
  constructor(message) {
    this.author_id = message.author.id;
    this.content = message.content;
    this.id = message.id;
    this.timestamp = message.createdTimestamp;
  }
}
