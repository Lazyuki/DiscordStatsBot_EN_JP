import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { DAY_IN_MILLIS } from './datetime';

const MAX_BACKUP_DAYS = 7;
const MAX_DB_BACKUP_DAYS = 3;

export function safeCreateDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

export function getBackupFilePath(
  key: string,
  date: Date,
  suffix: 'data' | 'config'
) {
  const dateStr = date.toISOString().split('T')[0];
  safeCreateDir('./backups');
  return `./backups/${dateStr}_${key}_${suffix}.json`;
}

export function getConfigFilePath(guildId: string) {
  safeCreateDir('./configs');
  return `./configs/${guildId}_config.json`;
}

export function getDataFilePath(guildId: string) {
  safeCreateDir('./data');
  return `./data/${guildId}_data.json`;
}

export function readConfig(key: string) {
  const configPath = getConfigFilePath(key);
  if (fs.existsSync(configPath)) {
    const json = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return json;
  }
  return {};
}

export function saveConfig(key: string, data: any) {
  const configPath = getConfigFilePath(key);
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

export function saveData(key: string, data: any) {
  const dataPath = getDataFilePath(key);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

export function saveBackup(
  key: string,
  date: Date,
  suffix: 'data' | 'config',
  data: any
) {
  const backupPath = getBackupFilePath(key, date, suffix);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
}

export function deleteOldBackups() {
  const backupDir = './backups';
  safeCreateDir(backupDir);
  const files = fs.readdirSync(backupDir);
  files.forEach((fileName) => {
    const fullFileName = path.join(backupDir, fileName);
    const file = fs.statSync(fullFileName);
    const now = new Date().getTime();
    const fileCreatedAt = new Date(file.ctime).getTime();
    if (fileName.endsWith('.db')) {
      // DB backups are bigger so delete more often
      if (now > fileCreatedAt + MAX_DB_BACKUP_DAYS * DAY_IN_MILLIS) {
        rimraf(fullFileName, () => {});
      }
    } else {
      if (now > fileCreatedAt + MAX_BACKUP_DAYS * DAY_IN_MILLIS) {
        rimraf(fullFileName, () => {});
      }
    }
  });
}
