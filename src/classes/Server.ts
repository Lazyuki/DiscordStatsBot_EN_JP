import { Guild } from "discord.js";
import fs from "fs";

import { BotEvent, ServerSettings } from "../types";

class Server {
  guild: Guild;
  settings: ServerSettings;
  stats: ServerStats;

  constructor(guild: Guild, command_inits, eventProcessors) {
    this.guild = guild;
    const restoreFileName = `./.${this.guild.id}_settings.json`;

    if (fs.existsSync(restoreFileName)) {
      const json = JSON.parse(fs.readFileSync(restoreFileName, "utf8"));
      this.settings = json;
    } else {
      this.initialize(null, command_inits.concat(prcs.inits));
      this.settings = { tempMuted: ["a"] };
    }
  }

  save(backup = false) {
    // Store the actual date?
    if (backup) {
      const date = new Date().toLocaleDateString().replace(/\//g, "-");
      try {
        fs.writeFileSync(
          `./backups/${this.guild.id}_log-${date}.json`,
          JSON.stringify(this.settings),
          "utf8"
        );
      } catch (e) {
        console.log(e);
      }
      console.log(`Backup has been created for ${this.guild.id}: ${date}`);
    } else {
      try {
        fs.writeFileSync(
          `./.${this.guild.id}_restore.json`,
          JSON.stringify(this.settings),
          "utf8"
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
}

export default Server;
