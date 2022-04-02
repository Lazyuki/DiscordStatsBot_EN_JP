import fs from 'fs';

import { Bot } from '@/types';
import db from '@db';
import { clearOldRecords } from '@database/statements';
import { getTodayISO } from '@utils/datetime';
import { getBackupFilePath, saveBackup } from '@utils/disk';

const DATABASE_BACKUP_DAYS = 3;

function getDbBackupFilePath(date: Date) {
  return `./backups/${date.toISOString().split('T')[0]}_${db.name}`;
}

function dailyTask(bot: Bot) {
  bot.utcDay = getTodayISO();
  // Clear records older than 30 days
  clearOldRecords();

  const today = new Date();
  for (const server of Object.values(bot.servers)) {
    server.backup();
  }
  // Bot config backup
  saveBackup('bot', today, 'config', bot.config);
  const configOldDate = new Date();
  configOldDate.setDate(configOldDate.getDate() - 7);
  const oldConfigBackupFile = getBackupFilePath('bot', configOldDate, 'config');
  if (fs.existsSync(oldConfigBackupFile)) {
    fs.unlinkSync(oldConfigBackupFile);
  }

  // Database backup
  db.backup(getDbBackupFilePath(today));
  const oldDate = new Date();
  oldDate.setDate(oldDate.getUTCDate() - DATABASE_BACKUP_DAYS);
  const oldBackupFile = getDbBackupFilePath(oldDate);
  if (fs.existsSync(oldBackupFile)) {
    fs.unlinkSync(oldBackupFile);
  }
}

export default dailyTask;
