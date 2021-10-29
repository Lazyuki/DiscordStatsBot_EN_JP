import { createLogger, transports, format } from 'winston';

const tz = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Europe/London',
  });
};

const logger = createLogger({
  transports: [
    new transports.File({ filename: 'all.log' }),
    new transports.File({ filename: 'errors.log', level: 'error' }),
  ],
  format: format.combine(
    format.timestamp({ format: tz }),
    format.printf(
      (log) => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`
    )
  ),
});

export default logger;
