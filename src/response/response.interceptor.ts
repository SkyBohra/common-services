// response.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IApiResponse } from './response.interface';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<T>> {
        const request = context.switchToHttp().getRequest();
        const statusCode = context.switchToHttp().getResponse().statusCode;

        return next.handle().pipe(
            map(data => {
                if (data && typeof data === 'object' && 'success' in data) {
                    return data as IApiResponse<T>;
                }

                return {
                    success: true,
                    message: 'Operation successful',
                    data,
                    timestamp: new Date().toISOString(),
                    statusCode,
                    path: request.url
                } as IApiResponse<T>;
            }),
        );
    }
}