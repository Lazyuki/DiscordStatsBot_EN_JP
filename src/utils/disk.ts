import fs from 'fs';

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
