import winston from 'winston';
import { config } from '../config';

// Create logger instance
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'invitation-admin-backend' },
  transports: [
    // Write to all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production then also log to the console
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Add Logtail transport if token is provided (for production logging)
if (config.logging.logtailToken) {
  // Note: You would need to install @logtail/winston for this to work
  // const { Logtail } = require('@logtail/node');
  // const { LogtailTransport } = require('@logtail/winston');
  // const logtail = new Logtail(config.logging.logtailToken);
  // logger.add(new LogtailTransport(logtail));
}

export { logger };
