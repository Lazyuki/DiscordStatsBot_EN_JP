import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('discord.db');

export function initTables() {
  const dbInit = fs.readFileSync('./db.sql', 'utf8');
  db.exec(dbInit);
}

initTables();

export default db;
