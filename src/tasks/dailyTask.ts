import { Bot } from '@/types';
import db from '@db';
import { clearOldRecords } from '@database/statements';
import { getTodayISO } from '@utils/datetime';
import { deleteOldBackups, saveBackup } from '@utils/disk';

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

  // Database backup
  db.backup(getDbBackupFilePath(today));

  deleteOldBackups();
}

export default dailyTask;
