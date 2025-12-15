// response.interface.ts
export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    timestamp: string;
    path?: string;
    statusCode: number;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface IPaginationOptions {
    page: number;
    limit: number;
    total: number;
}

export enum ResponseStatus {
    SUCCESS = 'success',
    ERROR = 'error',
    FAIL = 'fail'
}