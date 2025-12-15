// response.service.ts
import { Injectable } from '@nestjs/common';
import { IApiResponse, IPaginationOptions } from './response.interface';

@Injectable()
export class ResponseService {
    success<T>(
        data: T,
        message: string = 'Operation successful',
        statusCode: number = 200
    ): IApiResponse<T> {
        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            statusCode
        };
    }

    successWithPagination<T>(
        data: T[],
        pagination: IPaginationOptions,
        message: string = 'Data retrieved successfully',
        statusCode: number = 200
    ): IApiResponse<T[]> {
        const { page, limit, total } = pagination;
        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            statusCode,
            meta: { page, limit, total, totalPages }
        };
    }

    error(
        message: string = 'Operation failed',
        error: any = null,
        statusCode: number = 500,
        path?: string
    ): IApiResponse {
        return {
            success: false,
            message,
            error: error?.message || error || 'Internal server error',
            timestamp: new Date().toISOString(),
            statusCode,
            ...(path && { path })
        };
    }

    created<T>(data: T, message: string = 'Resource created successfully'): IApiResponse<T> {
        return this.success(data, message, 201);
    }

    badRequest(message: string = 'Bad request', error?: any): IApiResponse {
        return this.error(message, error, 400);
    }

    unauthorized(message: string = 'Unauthorized access', error?: any): IApiResponse {
        return this.error(message, error, 401);
    }

    notFound(message: string = 'Resource not found', error?: any): IApiResponse {
        return this.error(message, error, 404);
    }

    validationError(errors: any, message: string = 'Validation failed'): IApiResponse {
        return {
            success: false,
            message,
            error: errors,
            timestamp: new Date().toISOString(),
            statusCode: 422
        };
    }
}