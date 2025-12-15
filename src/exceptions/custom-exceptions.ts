// custom-exceptions.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
    constructor(
        message: string,
        statusCode: HttpStatus,
        public readonly errorCode?: string,
        public readonly details?: any
    ) {
        super({ success: false, message, errorCode, details, timestamp: new Date().toISOString() }, statusCode);
    }
}

export class ValidationException extends BaseException {
    constructor(message: string = 'Validation failed', details?: any) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
    }
}

export class NotFoundException extends BaseException {
    constructor(message: string = 'Resource not found', details?: any) {
        super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND', details);
    }
}

export class UnauthorizedException extends BaseException {
    constructor(message: string = 'Unauthorized access', details?: any) {
        super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', details);
    }
}

export class BadRequestException extends BaseException {
    constructor(message: string = 'Bad request', details?: any) {
        super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
    }
}

export class InternalServerException extends BaseException {
    constructor(message: string = 'Internal server error', details?: any) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', details);
    }
}