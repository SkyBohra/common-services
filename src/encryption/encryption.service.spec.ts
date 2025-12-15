// encryption.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
    let service: EncryptionService;
    const testSecretKey = 'test-super-secret-key-min-32-chars';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: EncryptionService,
                    useFactory: () => new EncryptionService({ secretKey: testSecretKey }),
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('Encryption and Decryption', () => {
        it('should encrypt and decrypt string data correctly', () => {
            const originalData = 'Hello, World!';

            const encrypted = service.encrypt(originalData);
            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).not.toBe(originalData);

            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(originalData);
        });

        it('should encrypt and decrypt object data correctly', () => {
            const originalData = {
                userId: 123,
                email: 'test@example.com',
                roles: ['admin', 'user'],
            };

            const encrypted = service.encrypt(originalData);
            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');

            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toEqual(originalData);
        });

        it('should encrypt and decrypt array data correctly', () => {
            const originalData = [1, 2, 3, 'test', { key: 'value' }];

            const encrypted = service.encrypt(originalData);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toEqual(originalData);
        });

        it('should handle null values', () => {
            const originalData = { value: null };

            const encrypted = service.encrypt(originalData);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toEqual(originalData);
        });

        it('should handle empty strings', () => {
            const originalData = '';

            const encrypted = service.encrypt(originalData);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(originalData);
        });

        it('should produce different encrypted values for same data', () => {
            const data = 'test data';

            const encrypted1 = service.encrypt(data);
            const encrypted2 = service.encrypt(data);

            // Should be different due to random IV
            expect(encrypted1).not.toBe(encrypted2);

            // But both should decrypt to same value
            expect(service.decrypt(encrypted1)).toBe(data);
            expect(service.decrypt(encrypted2)).toBe(data);
        });

        it('should throw error on invalid encrypted data', () => {
            expect(() => service.decrypt('invalid-encrypted-data')).toThrow();
        });

        it('should throw error on tampered encrypted data', () => {
            const encrypted = service.encrypt('test data');
            const tampered = encrypted.substring(0, encrypted.length - 5) + 'XXXXX';

            expect(() => service.decrypt(tampered)).toThrow();
        });

        it('should handle large data', () => {
            const largeData = {
                users: Array(1000).fill(null).map((_, i) => ({
                    id: i,
                    name: `User ${i}`,
                    email: `user${i}@example.com`,
                })),
            };

            const encrypted = service.encrypt(largeData);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toEqual(largeData);
        });

        it('should handle special characters', () => {
            const specialData = 'Test with 特殊字符 émojis 🚀 and symbols !@#$%^&*()';

            const encrypted = service.encrypt(specialData);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(specialData);
        });
    });

    describe('Hashing', () => {
        it('should generate hash for string', () => {
            const data = 'password123';
            const hash = service.hash(data);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA-256 produces 64 character hex
        });

        it('should generate same hash for same input', () => {
            const data = 'test-password';
            const hash1 = service.hash(data);
            const hash2 = service.hash(data);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different inputs', () => {
            const hash1 = service.hash('password1');
            const hash2 = service.hash('password2');

            expect(hash1).not.toBe(hash2);
        });

        it('should be case sensitive', () => {
            const hash1 = service.hash('Password');
            const hash2 = service.hash('password');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Hash Verification', () => {
        it('should verify correct hash', () => {
            const data = 'secure-password';
            const hash = service.hash(data);

            const isValid = service.verifyHash(data, hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect hash', () => {
            const data = 'password123';
            const hash = service.hash(data);

            const isValid = service.verifyHash('wrong-password', hash);
            expect(isValid).toBe(false);
        });

        it('should reject tampered hash', () => {
            const data = 'password';
            const hash = service.hash(data);
            const tamperedHash = hash.substring(0, hash.length - 2) + 'XX';

            const isValid = service.verifyHash(data, tamperedHash);
            expect(isValid).toBe(false);
        });

        it('should handle empty string hash verification', () => {
            const emptyHash = service.hash('');
            const isValid = service.verifyHash('', emptyHash);

            expect(isValid).toBe(true);
        });
    });

    describe('Token Generation', () => {
        it('should generate random token with default length', () => {
            const token = service.generateToken();

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBe(64); // 32 bytes = 64 hex characters
        });

        it('should generate token with custom length', () => {
            const token = service.generateToken(16);

            expect(token.length).toBe(32); // 16 bytes = 32 hex characters
        });

        it('should generate different tokens each time', () => {
            const token1 = service.generateToken();
            const token2 = service.generateToken();

            expect(token1).not.toBe(token2);
        });

        it('should generate tokens with only hex characters', () => {
            const token = service.generateToken();
            const hexRegex = /^[0-9a-f]+$/;

            expect(hexRegex.test(token)).toBe(true);
        });

        it('should handle large token sizes', () => {
            const token = service.generateToken(128);

            expect(token.length).toBe(256); // 128 bytes = 256 hex
        });
    });

    describe('HMAC Signature', () => {
        it('should generate signature for string data', () => {
            const data = 'test data';
            const signature = service.generateSignature(data);

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(64); // HMAC-SHA256
        });

        it('should generate signature for object data', () => {
            const data = { id: 1, name: 'Test' };
            const signature = service.generateSignature(data);

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
        });

        it('should generate same signature for same data', () => {
            const data = { test: 'data' };
            const signature1 = service.generateSignature(data);
            const signature2 = service.generateSignature(data);

            expect(signature1).toBe(signature2);
        });

        it('should generate different signatures for different data', () => {
            const signature1 = service.generateSignature('data1');
            const signature2 = service.generateSignature('data2');

            expect(signature1).not.toBe(signature2);
        });
    });

    describe('Signature Verification', () => {
        it('should verify valid signature', () => {
            const data = { userId: 123, action: 'login' };
            const signature = service.generateSignature(data);

            const isValid = service.verifySignature(data, signature);
            expect(isValid).toBe(true);
        });

        it('should reject invalid signature', () => {
            const data = { test: 'data' };
            const signature = service.generateSignature(data);
            const modifiedData = { test: 'modified' };

            const isValid = service.verifySignature(modifiedData, signature);
            expect(isValid).toBe(false);
        });

        it('should reject tampered signature', () => {
            const data = 'test';
            const signature = service.generateSignature(data);
            const tamperedSignature = signature.substring(0, 60) + 'XXXX';

            const isValid = service.verifySignature(data, tamperedSignature);
            expect(isValid).toBe(false);
        });

        it('should be case sensitive for data', () => {
            const data1 = 'Test Data';
            const data2 = 'test data';
            const signature = service.generateSignature(data1);

            const isValid = service.verifySignature(data2, signature);
            expect(isValid).toBe(false);
        });
    });

    describe('Algorithm and Configuration', () => {
        it('should work with default configuration', () => {
            const defaultService = new EncryptionService();
            const data = 'test';

            const encrypted = defaultService.encrypt(data);
            const decrypted = defaultService.decrypt(encrypted);

            expect(decrypted).toBe(data);
        });

        it('should work with custom algorithm', () => {
            const customService = new EncryptionService({
                secretKey: testSecretKey,
                algorithm: 'aes-256-gcm',
            });

            const data = { test: 'custom algorithm' };
            const encrypted = customService.encrypt(data);
            const decrypted = customService.decrypt(encrypted);

            expect(decrypted).toEqual(data);
        });

        it('should use environment variable if available', () => {
            process.env.ENCRYPTION_KEY = 'env-secret-key';
            const envService = new EncryptionService();

            const data = 'test with env key';
            const encrypted = envService.encrypt(data);
            const decrypted = envService.decrypt(encrypted);

            expect(decrypted).toBe(data);

            delete process.env.ENCRYPTION_KEY;
        });
    });

    describe('Error Handling', () => {
        it('should throw meaningful error on encryption failure', () => {
            // Create service with invalid configuration
            const invalidService = new EncryptionService({
                secretKey: '', // Empty key
            });

            expect(() => invalidService.encrypt('test')).toThrow();
        });

        it('should throw meaningful error on decryption failure', () => {
            expect(() => service.decrypt('clearly-invalid-data')).toThrow(/Decryption failed/);
        });

        it('should handle undefined data gracefully', () => {
            const encrypted = service.encrypt(undefined);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBeUndefined();
        });
    });

    describe('Security Features', () => {
        it('should produce non-deterministic encryption (due to IV)', () => {
            const data = 'sensitive data';
            const encrypted1 = service.encrypt(data);
            const encrypted2 = service.encrypt(data);

            // Same data should produce different ciphertext
            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should include authentication tag in encrypted data', () => {
            const encrypted = service.encrypt('test');
            const decoded = JSON.parse(
                Buffer.from(encrypted, 'base64').toString('utf8')
            );

            expect(decoded).toHaveProperty('authTag');
            expect(decoded.authTag).toBeDefined();
        });

        it('should include IV in encrypted data', () => {
            const encrypted = service.encrypt('test');
            const decoded = JSON.parse(
                Buffer.from(encrypted, 'base64').toString('utf8')
            );

            expect(decoded).toHaveProperty('iv');
            expect(decoded.iv).toBeDefined();
        });
    });
});