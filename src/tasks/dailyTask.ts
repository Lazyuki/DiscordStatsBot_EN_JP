import fs from 'fs';

import { Bot } from '@/types';
import db from '@db';
import { clearOldRecords } from '@database/statements';
import { getTodayISO } from '@utils/datetime';

const DATABASE_BACKUP_DAYS = 3;

function getBackupFilePath(date: Date) {
  return `./backups/${date.toISOString().split('T')[0]}_${db.name}`;
}

function dailyTask(bot: Bot) {
  bot.utcDay = getTodayISO();

  const today = new Date();
  for (const server of Object.values(bot.servers)) {
    server.backup();
  }
  // Clear records older than 30 days
  clearOldRecords();

  db.backup(getBackupFilePath(today));
  const oldDate = new Date();
  oldDate.setDate(oldDate.getUTCDate() - DATABASE_BACKUP_DAYS);
  const oldBackupFile = getBackupFilePath(oldDate);
  if (fs.existsSync(oldBackupFile)) {
    fs.unlinkSync(oldBackupFile);
  }
}

export default dailyTask;
