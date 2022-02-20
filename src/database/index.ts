import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const db = new Database('discord_ciri.db');

export function initTables() {
  const dbInit = fs.readFileSync(
    path.resolve(path.dirname(__filename) + '/schema.sql'),
    'utf8'
  );
  const queryBlocks = dbInit.split('\n\n');
  queryBlocks.forEach((b) => {
    db.exec(b);
  });
}

initTables();

export default db;
