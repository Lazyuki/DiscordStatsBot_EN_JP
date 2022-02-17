import winston from 'winston';

const tz = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Europe/London',
  });
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'all.log' }),
    new winston.transports.File({ filename: 'errors.log', level: 'error' }),
  ],
  format: winston.format.combine(
    winston.format.timestamp({ format: tz }),
    winston.format.printf(
      (log) => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`
    )
  ),
});

export default logger;
