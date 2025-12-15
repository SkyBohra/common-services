// exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logging/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: CustomLoggerService) {
        this.logger.setContext('GlobalExceptionFilter');
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        let details: any = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || exception.message;
                errorCode = (exceptionResponse as any).errorCode || 'HTTP_EXCEPTION';
                details = (exceptionResponse as any).details || null;
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            details = { name: exception.name, stack: process.env.NODE_ENV === 'development' ? exception.stack : undefined };
        }

        const errorResponse = {
            success: false,
            statusCode: status,
            message,
            errorCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            ...(details && { details })
        };

        this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception instanceof Error ? exception.stack : undefined);
        response.status(status).json(errorResponse);
    }
}