import { Guild } from 'discord.js';
import fs from 'fs';
import env from 'env-var';

import logger from '@/logger';
import { Bot, ServerConfig, ServerTemp } from '@/types';

function getBackupFilePath(guildId: string, date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  return `./backups/${dateStr}-${guildId}_config.json`;
}

function getRestoreFilePath(guildId: string) {
  return `./${guildId}_config.json`;
}

class Server {
  guild: Guild;
  config: ServerConfig;
  // temp: ServerTemp;
  // cache: ServerStatsCache;

  constructor(guild: Guild, bot: Bot) {
    this.guild = guild;
    const restoreFileName = getRestoreFilePath(guild.id);

    this.config = {
      prefix: env.get('DEFAULT_PREFIX').required().asString(),
    } as ServerConfig;
    if (fs.existsSync(restoreFileName)) {
      const json = JSON.parse(fs.readFileSync(restoreFileName, 'utf8'));
      this.config = json;
    }
    bot.commandInits.forEach((init) => init(this.config));
  }

  save(backup = false) {
    if (backup) {
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
    } else {
      try {
        const restoreFileName = getRestoreFilePath(this.guild.id);
        fs.writeFileSync(restoreFileName, JSON.stringify(this.config), 'utf8');
      } catch (e) {
        logger.error(e);
      }
    }
  }
}

export default Server;
