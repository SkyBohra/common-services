// response.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ResponseService } from './response.service';
import { IApiResponse } from './response.interface';

describe('ResponseService', () => {
    let service: ResponseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ResponseService],
        }).compile();

        service = module.get<ResponseService>(ResponseService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('success()', () => {
        it('should return success response with data', () => {
            const testData = { id: 1, name: 'Test User' };
            const result = service.success(testData, 'User fetched successfully');

            expect(result.success).toBe(true);
            expect(result.message).toBe('User fetched successfully');
            expect(result.data).toEqual(testData);
            expect(result.statusCode).toBe(200);
            expect(result.timestamp).toBeDefined();
        });

        it('should use default message if not provided', () => {
            const result = service.success({ test: 'data' });

            expect(result.message).toBe('Operation successful');
        });

        it('should accept custom status code', () => {
            const result = service.success({ test: 'data' }, 'Custom message', 201);

            expect(result.statusCode).toBe(201);
        });
    });

    describe('successWithPagination()', () => {
        it('should return paginated response with meta', () => {
            const users = [
                { id: 1, name: 'User 1' },
                { id: 2, name: 'User 2' },
            ];
            const pagination = { page: 1, limit: 10, total: 50 };

            const result = service.successWithPagination(users, pagination);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(users);
            expect(result.meta).toBeDefined();
            expect(result.meta?.page).toBe(1);
            expect(result.meta?.limit).toBe(10);
            expect(result.meta?.total).toBe(50);
            expect(result.meta?.totalPages).toBe(5);
        });

        it('should calculate total pages correctly', () => {
            const result = service.successWithPagination(
                [],
                { page: 1, limit: 10, total: 25 }
            );

            expect(result.meta).toBeDefined();
            expect(result.meta?.totalPages).toBe(3);
        });

        it('should handle edge case with 0 total', () => {
            const result = service.successWithPagination(
                [],
                { page: 1, limit: 10, total: 0 }
            );

            expect(result.meta).toBeDefined();
            expect(result.meta?.totalPages).toBe(0);
        });
    });

    describe('error()', () => {
        it('should return error response', () => {
            const result = service.error('Something went wrong', new Error('Test error'));

            expect(result.success).toBe(false);
            expect(result.message).toBe('Something went wrong');
            expect(result.error).toBe('Test error');
            expect(result.statusCode).toBe(500);
        });

        it('should use default message if not provided', () => {
            const result = service.error();

            expect(result.message).toBe('Operation failed');
            expect(result.error).toBe('Internal server error');
        });

        it('should include path if provided', () => {
            const result = service.error('Error', null, 500, '/api/users');

            expect(result.path).toBe('/api/users');
        });

        it('should handle string errors', () => {
            const result = service.error('Failed', 'Simple error message');

            expect(result.error).toBe('Simple error message');
        });

        it('should extract message from Error object', () => {
            const error = new Error('Database connection failed');
            const result = service.error('Operation failed', error);

            expect(result.error).toBe('Database connection failed');
        });
    });

    describe('created()', () => {
        it('should return 201 status code', () => {
            const newUser = { id: 1, name: 'New User' };
            const result = service.created(newUser);

            expect(result.statusCode).toBe(201);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(newUser);
        });

        it('should use default created message', () => {
            const result = service.created({ id: 1 });

            expect(result.message).toBe('Resource created successfully');
        });
    });

    describe('badRequest()', () => {
        it('should return 400 status code', () => {
            const result = service.badRequest('Invalid input');

            expect(result.statusCode).toBe(400);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid input');
        });
    });

    describe('unauthorized()', () => {
        it('should return 401 status code', () => {
            const result = service.unauthorized('Token expired');

            expect(result.statusCode).toBe(401);
            expect(result.message).toBe('Token expired');
        });
    });

    describe('notFound()', () => {
        it('should return 404 status code', () => {
            const result = service.notFound('User not found');

            expect(result.statusCode).toBe(404);
            expect(result.message).toBe('User not found');
        });
    });

    describe('validationError()', () => {
        it('should return 422 status code with validation errors', () => {
            const validationErrors = {
                email: 'Invalid email format',
                password: 'Password too short',
            };

            const result = service.validationError(validationErrors);

            expect(result.statusCode).toBe(422);
            expect(result.success).toBe(false);
            expect(result.error).toEqual(validationErrors);
        });
    });

    describe('Response structure', () => {
        it('should always include timestamp', () => {
            const result = service.success({ test: 'data' });

            expect(result.timestamp).toBeDefined();
            expect(typeof result.timestamp).toBe('string');
            expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
        });

        it('should always include success flag', () => {
            const successResult = service.success({ test: 'data' });
            const errorResult = service.error('Error');

            expect(successResult.success).toBe(true);
            expect(errorResult.success).toBe(false);
        });

        it('should always include statusCode', () => {
            const result = service.success({ test: 'data' });

            expect(result.statusCode).toBeDefined();
            expect(typeof result.statusCode).toBe('number');
        });
    });
});