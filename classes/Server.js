const Util = require('./Util.js');
const fs = require('fs');

module.exports = class Server {
  constructor(guild, command_inits, prcs) {
    this.guild = guild;
    this.processors = prcs.processors;
    if (fs.existsSync(`./.${this.guild.id}_restore.json`)) {
      let json = JSON.parse(
        fs.readFileSync(`./.${this.guild.id}_restore.json`, 'utf8')
      );
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

  async processReaction(reaction, user, added, bot) {
    this.processors['REACT'].forEach((p) => {
      if (p.isAllowed(reaction.message, this, bot)) {
        p.process(reaction, user, added, this, bot);
      }
    });
  }

  async processVoice(oldMember, newMember) {
    this.processors['VOICE'].forEach((p) => {
      if (p.isAllowed(oldMember)) {
        p.process(oldMember, newMember, this);
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

  async addNewUser(member) {
    this.processors['JOIN'].forEach((p) => {
      p.process(member, this);
    });
  }

  async removeUser(member) {
    this.processors['LEAVE'].forEach((p) => {
      p.process(member, this);
    });
  }

  async userUpdate(oldUser, newUser) {
    this.processors['USER_UPDATE'].forEach((p) => {
      if (p.isAllowed(newUser.id, this)) {
        p.process(oldUser, newUser, this);
      }
    });
  }

  async memberUpdate(oldMember, newMember) {
    this.processors['MEMBER_UPDATE'].forEach((p) => {
      if (p.isAllowed(newMember.id, this)) {
        p.process(oldMember, newMember, this);
      }
    });
  }

  async banAdd(user) {
    this.processors['BAN_ADD'].forEach((p) => {
      if (p.isAllowed(user.id, this)) {
        p.process(user, this);
      }
    });
  }

  async hourly() {
    this.processors['HOURLY'].forEach((p) => {
      p.process(this);
    });
  }

  save(backup = false) {
    // Store the actual date?

    if (backup) {
      var date = new Date().toLocaleDateString().replace(/\//g, '-');
      try {
        let serverNoGuild = this;
        //delete serverNoGuild.guild;
        fs.writeFileSync(
          `./backups/${this.guild.id}_log-${date}.json`,
          JSON.stringify(serverNoGuild),
          'utf8'
        );
      } catch (e) {
        console.log(e);
      }
      console.log(`Backup has been created for ${this.guild.id}: ${date}`);
    } else {
      try {
        let serverNoGuild = this;
        //delete serverNoGuild.guild;
        fs.writeFileSync(
          `./.${this.guild.id}_restore.json`,
          JSON.stringify(serverNoGuild),
          'utf8'
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
};
