import { Guild } from 'discord.js';
import fs from 'fs';

import logger, { discordLogError } from '@/logger';
import {
  Bot,
  ServerConfig,
  ServerTemp,
  ServerSchedules,
  ServerData,
} from '@/types';
import { getIgnoredBotPrefixRegex } from '@commands/configuration/config';
import {
  getConfigFilePath,
  getDataFilePath,
  getBackupFilePath,
  saveConfig,
  saveData,
  saveBackup,
} from '@utils/disk';

declare module '@/types' {
  interface ServerTemp {
    ignoredBotPrefixRegex: RegExp | null;
  }
}

class Server {
  guild: Guild;
  config: ServerConfig; // config for each server
  temp: ServerTemp; // temporary server state that does not persist
  data: ServerData; // server data that persists but not stored in the database.

  constructor(guild: Guild, bot: Bot) {
    this.guild = guild;
    this.temp = {} as ServerTemp;

    guild.members.fetch(); // fetch all members even if offline

    const configFileName = getConfigFilePath(guild.id);
    this.config = {} as ServerConfig;
    if (fs.existsSync(configFileName)) {
      const json = JSON.parse(fs.readFileSync(configFileName, 'utf8'));
      this.config = json;
    }

    this.data = {
      schedules: {} as ServerSchedules,
    } as ServerData;

    const dataFileName = getDataFilePath(guild.id);
    if (fs.existsSync(dataFileName)) {
      const json = JSON.parse(fs.readFileSync(dataFileName, 'utf8'));
      this.data = json;
      this.data.schedules ||= {} as ServerSchedules;
    }
    try {
      bot.commandInits.forEach((init) => init(this));
      bot.serverInits.forEach((init) => init(this));
      this.save();
    } catch (e) {
      const error = e as Error;
      logger.error(
        `Server Command Initialization Error: ${error?.message}\n${error.stack}`
      );
      discordLogError(
        bot,
        error,
        `Server Command Initialization Error: ${error?.message}\n${error.stack}`
      );
    }
  }

  readConfigFromBackup(date: Date) {
    const backupFile = getBackupFilePath(this.guild.id, date, 'config');
    if (fs.existsSync(backupFile)) {
      const json = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      this.config = json;
      return true;
    }
    return false;
  }

  reloadConfig(bot: Bot) {
    const configFileName = getConfigFilePath(this.guild.id);
    if (fs.existsSync(configFileName)) {
      const json = JSON.parse(fs.readFileSync(configFileName, 'utf8'));
      this.config = json;
      this.temp.ignoredBotPrefixRegex = getIgnoredBotPrefixRegex(
        this.config.ignoredBotPrefixes
      );
    }
  }

  reloadData(bot: Bot) {
    const dataFileName = getDataFilePath(this.guild.id);
    if (fs.existsSync(dataFileName)) {
      const json = JSON.parse(fs.readFileSync(dataFileName, 'utf8'));
      this.data = json;
    }
  }

  backup() {
    try {
      saveBackup(this.guild.id, new Date(), 'config', this.config);
      saveBackup(this.guild.id, new Date(), 'data', this.data);
    } catch (e) {
      logger.error(e);
    }
  }

  save() {
    try {
      saveConfig(this.guild.id, this.config);
      saveData(this.guild.id, this.data);
    } catch (e) {
      logger.error(e);
    }
  }
}

export default Server;
