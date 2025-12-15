// logger.service.ts
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService implements NestLoggerService {
    private logger: winston.Logger;
    private context?: string;

    constructor(context?: string) {
        this.context = context;
        this.logger = this.createLogger();
    }

    private createLogger(): winston.Logger {
        const logFormat = winston.format.printf(({ level, message, timestamp, context, trace }) => {
            let msg = `${timestamp} [${level.toUpperCase()}] ${context ? `[${context}]` : ''} ${message}`;
            if (trace) msg += `\n${trace}`;
            return msg;
        });

        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: process.env.SERVICE_NAME || 'app' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        logFormat
                    )
                }),
                new DailyRotateFile({
                    filename: 'logs/error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    maxSize: '20m',
                    maxFiles: '14d'
                }),
                new DailyRotateFile({
                    filename: 'logs/combined-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d'
                })
            ]
        });
    }

    setContext(context: string) {
        this.context = context;
    }

    log(message: string, context?: string) {
        this.logger.info(message, { context: context || this.context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { context: context || this.context, trace });
    }

    warn(message: string, context?: string) {
        this.logger.warn(message, { context: context || this.context });
    }

    debug(message: string, context?: string) {
        this.logger.debug(message, { context: context || this.context });
    }

    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context: context || this.context });
    }

    logRequest(req: any) {
        this.logger.info('Incoming Request', {
            context: this.context,
            method: req.method,
            url: req.url,
            ip: req.ip
        });
    }

    logResponse(req: any, res: any, responseTime: number) {
        this.logger.info('Outgoing Response', {
            context: this.context,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`
        });
    }
}