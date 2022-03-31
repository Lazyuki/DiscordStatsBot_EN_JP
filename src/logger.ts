import winston from 'winston';
import { DEBUG } from '@/envs';

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'all.log' }),
    new winston.transports.File({ filename: 'errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'info.log', level: 'info' }),
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

export default logger;
