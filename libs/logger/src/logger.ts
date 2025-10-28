import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info: any) => {
      const { timestamp, level, message, ...meta } = info || {};
      const metaStr = meta && Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}] ${message} ${metaStr}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

export class WinstonLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {
    logger.info(message, ...(optionalParams || []));
  }
  error(message: any, ...optionalParams: any[]) {
    logger.error(message, ...(optionalParams || []));
  }
  warn(message: any, ...optionalParams: any[]) {
    logger.warn(message, ...(optionalParams || []));
  }
  debug?(message: any, ...optionalParams: any[]) {
    logger.debug(message, ...(optionalParams || []));
  }
  verbose?(message: any, ...optionalParams: any[]) {
    logger.verbose(message, ...(optionalParams || []));
  }
}

export default logger;
