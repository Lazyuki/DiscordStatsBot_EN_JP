import fs from 'fs';
import { Message } from 'discord.js';

import { Bot, GuildMessage } from '@/types';
import db from '@db';
import { saveConfig } from '@utils/disk';

export const RESTART_TMP_FILE = '.restart.tmp';

/**
 *
 * Clean things up and destroy the bot
 * @param bot Bot
 */
function exitTask(bot: Bot, message?: GuildMessage) {
  for (const server of Object.values(bot.servers)) {
    server.save();
  }
  bot.botExits.forEach((fn) => fn(bot));
  saveConfig('bot', bot.config);

  if (message) {
    fs.writeFileSync(
      RESTART_TMP_FILE,
      `${message.guild.id}-${message.channelId}`,
      'utf8'
    );
  }
  bot.destroy();
  db.close();
}

export default exitTask;
