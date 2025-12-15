// encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptionConfig {
    algorithm?: string;
    secretKey: string;
}

@Injectable()
export class EncryptionService {
    private readonly algorithm: string;
    private readonly secretKey: Buffer;
    private readonly ivLength: number = 16;

    constructor(config?: EncryptionConfig) {
        this.algorithm = config?.algorithm || 'aes-256-gcm';
        const key = config?.secretKey || process.env.ENCRYPTION_KEY || 'default-secret-key-change-me';
        this.secretKey = crypto.scryptSync(key, 'salt', 32);
    }

    encrypt(data: any): string {
        try {
            const textToEncrypt = typeof data === 'string' ? data : JSON.stringify(data);
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv) as crypto.CipherGCM;

            let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();

            const result = {
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                data: encrypted
            };

            return Buffer.from(JSON.stringify(result)).toString('base64');
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    decrypt(encryptedData: string): any {
        try {
            const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
            const { iv, authTag, data } = JSON.parse(decoded);

            const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(iv, 'hex')) as crypto.DecipherGCM;
            (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, 'hex'));

            let decrypted = decipher.update(data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    verifyHash(data: string, hash: string): boolean {
        const dataHash = this.hash(data);
        return crypto.timingSafeEqual(Buffer.from(dataHash), Buffer.from(hash));
    }

    generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    generateSignature(data: any): string {
        const textData = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHmac('sha256', this.secretKey).update(textData).digest('hex');
    }

    verifySignature(data: any, signature: string): boolean {
        const expectedSignature = this.generateSignature(data);
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    }
}