import { Guild } from 'discord.js';
import fs from 'fs';

import logger from '@/logger';
import {
  Bot,
  ServerConfig,
  ServerTemp,
  ServerCache,
  ServerSchedule,
} from '@/types';

function safeCreateDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function getBackupFilePath(guildId: string, date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  safeCreateDir('./backups');
  return `./backups/${dateStr}-${guildId}_config.json`;
}

function getConfigFilePath(guildId: string) {
  safeCreateDir('./configs');
  return `./configs/${guildId}_config.json`;
}
function getScheduleFilePath(guildId: string) {
  safeCreateDir('./schedules');
  return `./schedules/${guildId}_schedule.json`;
}

class Server {
  guild: Guild;
  config: ServerConfig;
  temp: ServerTemp; // temporary server state that does not persist
  cache: ServerCache; // Database cache that does not persist
  schedule: ServerSchedule; // Schedules to keep track of

  constructor(guild: Guild, bot: Bot) {
    this.guild = guild;
    this.temp = {} as ServerTemp;
    this.cache = {} as ServerCache;

    const configFileName = getConfigFilePath(guild.id);
    this.config = {} as ServerConfig;
    if (fs.existsSync(configFileName)) {
      const json = JSON.parse(fs.readFileSync(configFileName, 'utf8'));
      this.config = json;
    }

    const scheduleFileName = getScheduleFilePath(guild.id);
    this.schedule = {} as ServerSchedule;
    if (fs.existsSync(scheduleFileName)) {
      const json = JSON.parse(fs.readFileSync(scheduleFileName, 'utf8'));
      this.schedule = json;
    }
    try {
      bot.commandInits.forEach((init) => init(this));
      this.save();
    } catch (e) {
      const error = e as Error;
      logger.error(`Server Command Initialization Error: ${error?.message}`);
    }
  }

  readFromBackup(date: Date) {
    const backupFile = getBackupFilePath(this.guild.id, date);
    if (fs.existsSync(backupFile)) {
      const json = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      this.config = json;
      return true;
    }
    return false;
  }

  backup() {
    const backupFile = getBackupFilePath(this.guild.id, new Date());
    try {
      fs.writeFileSync(backupFile, JSON.stringify(this.config), 'utf8');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 7);
      const oldBackupFile = getBackupFilePath(this.guild.id, oldDate);
      if (fs.existsSync(oldBackupFile)) {
        fs.unlinkSync(oldBackupFile);
      }
    } catch (e) {
      logger.error(e);
    }
  }

  save() {
    try {
      const configFileName = getConfigFilePath(this.guild.id);
      fs.writeFileSync(configFileName, JSON.stringify(this.config), 'utf8');
      const scheduleFileName = getScheduleFilePath(this.guild.id);
      fs.writeFileSync(scheduleFileName, JSON.stringify(this.schedule), 'utf8');
    } catch (e) {
      logger.error(e);
    }
  }
}

export default Server;
