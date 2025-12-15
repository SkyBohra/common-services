// encryption.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from './encryption.service';
import { Reflector } from '@nestjs/core';

export const SKIP_ENCRYPTION_KEY = 'skipEncryption';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
    constructor(
        private readonly encryptionService: EncryptionService,
        private readonly reflector: Reflector
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const skipEncryption = this.reflector.getAllAndOverride<boolean>(
            SKIP_ENCRYPTION_KEY,
            [context.getHandler(), context.getClass()]
        );
        const acceptEncryption = request.headers['x-accept-encryption'] === 'true';

        return next.handle().pipe(
            map(data => {
                if (skipEncryption || !acceptEncryption || data?.encrypted) {
                    return data;
                }

                try {
                    const encryptedData = this.encryptionService.encrypt(data);
                    const signature = this.encryptionService.generateSignature(encryptedData);

                    return {
                        encrypted: true,
                        data: encryptedData,
                        signature,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    return {
                        encrypted: false,
                        data,
                        error: 'Encryption failed',
                        timestamp: new Date().toISOString()
                    };
                }
            })
        );
    }
}

@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
    constructor(private readonly encryptionService: EncryptionService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        if (request.body?.encrypted && request.body?.data) {
            try {
                const isValid = this.encryptionService.verifySignature(request.body.data, request.body.signature);
                if (!isValid) throw new Error('Invalid signature');

                const decryptedData = this.encryptionService.decrypt(request.body.data);
                request.body = decryptedData;
            } catch (error) {
                throw new Error(`Decryption failed: ${error.message}`);
            }
        }

        return next.handle();
    }
}