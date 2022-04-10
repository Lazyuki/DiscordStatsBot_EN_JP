import winston from 'winston';
import { BOT_LOG_CHANNEL_ID, DEBUG } from '@/envs';
import { Bot } from '@/types';
import { makeEmbed } from '@utils/embed';
import { codeBlock } from '@utils/formatString';

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'all.log' }),
    new winston.transports.File({ filename: 'errors.log', level: 'error' }),
    ...(DEBUG ? [new winston.transports.Console()] : []),
  ],
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (log) => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`
    )
  ),
});

export async function discordLogInfo(bot: Bot, message: string) {
  if (BOT_LOG_CHANNEL_ID) {
    const botLogChannel = bot.channels.cache.get(BOT_LOG_CHANNEL_ID);
    botLogChannel?.isText() && (await botLogChannel.send(message));
  }
}

export async function discordLogError(
  bot: Bot,
  error: Error,
  additionalContext?: string
) {
  if (BOT_LOG_CHANNEL_ID && error) {
    const botLogChannel = bot.channels.cache.get(BOT_LOG_CHANNEL_ID);
    const httpStatus = (error as any).httpStatus;
    botLogChannel?.isText() &&
      (await botLogChannel.send(
        makeEmbed({
          content: `<@${bot.ownerId}>`,
          title: `${httpStatus ? httpStatus + ' ' : ''}${error.name || error}:${
            error.message
          }`,
          description: codeBlock(
            error.stack?.substring(0, 4086) || 'No stack trace'
          ),
          fields: additionalContext
            ? [{ name: 'Context', value: additionalContext.substring(0, 1024) }]
            : undefined,
        })
      ));
  }
}

export default logger;
