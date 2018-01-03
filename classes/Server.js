const Util = require('./Util.js');
const fs = require('fs');

module.exports = class Server {
  constructor(guild, command_inits, prcs) {
    this.guild = guild;
    this.processors = prcs.processors;
    if (fs.existsSync(`./.${this.guild.id}_restore.json`)) {
      let json = JSON.parse(fs.readFileSync(`./.${this.guild.id}_restore.json`, 'utf8'));
      this.initialize(json, command_inits.concat(prcs.inits));      
    } else {
      this.initialize(null, command_inits.concat(prcs.inits));
    }
  }

  async initialize(json, inits) {
    inits.forEach((fn) => {
      fn(json, this);
    });
  }

  async processNewMessage(message, bot) {
    let language = Util.lang(message.content);
    this.processors['NEW'].forEach((p) => {
      if (p.isAllowed(message, this, bot)) {
        p.process(message, this, bot, language);
      }
    });
  }

  async processReaction(reaction, user, added) {
    this.processors['REACT'].forEach((p) => {
      if (p.isAllowed(reaction.message)) {
        p.process(reaction, user, this);
      }
    });
  }

  async addDeletedMessage(message) {
    this.processors['DELETE'].forEach((p) => {
      if (p.isAllowed(message)) {
        p.process(message, this);
      }
    });
  }

  async addEdits(oldMessage, newMessage, bot) {
    let language = Util.lang(newMessage.content);
    this.processors['EDIT'].forEach((p) => {
      if (p.isAllowed(newMessage, this, bot)) {
        p.process(newMessage, this, bot, language);
      }
    });
  }

  async addNewUser(memberID) { 
    this.processors['JOIN'].forEach((p) => {
      p.process(memberID, this);
    });
  }
  /*
  async userUpdate(oldUser, newUser) { 
    this.processors['USER_UPDATE'].forEach((p) => {
      if (p.isAllowed(newUser.id, this)) {
        p.process(newUser, this);
      }
    });
  }
  */
  save(backup = false) {
    // Store the actual date?
    if (backup) {
      var date = new Date().toLocaleDateString().replace(/\//g, '-');
      try {
        fs.writeFileSync(`./backups/${this.guild.id}_log-${date}.json`, JSON.stringify(this), 'utf8');
      } catch (e) {
        console.log(e);
      }
      console.log(`Backup has been created for ${this.guild.id}: ${date}`);
    } else {
      try {
        fs.writeFileSync(`./.${this.guild.id}_restore.json`, JSON.stringify(this), 'utf8');
      } catch (e) {
        console.log(e);
      }
    }
  }
};
