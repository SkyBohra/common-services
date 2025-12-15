// response.interceptor.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TransformResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformResponseInterceptor', () => {
    let interceptor: TransformResponseInterceptor<any>;

    const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
                url: '/api/test',
            }),
            getResponse: jest.fn().mockReturnValue({
                statusCode: 200,
            }),
        }),
    } as unknown as ExecutionContext;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TransformResponseInterceptor],
        }).compile();

        interceptor = module.get<TransformResponseInterceptor<any>>(
            TransformResponseInterceptor,
        );
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    describe('Data Transformation', () => {
        it('should wrap plain data in standard response format', (done) => {
            const testData = { id: 1, name: 'Test' };
            const mockCallHandler: CallHandler = {
                handle: () => of(testData),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toMatchObject({
                        success: true,
                        message: 'Operation successful',
                        data: testData,
                        statusCode: 200,
                        path: '/api/test',
                    });
                    expect(result.timestamp).toBeDefined();
                    done();
                },
            });
        });

        it('should wrap array data in standard format', (done) => {
            const testData = [1, 2, 3];
            const mockCallHandler: CallHandler = {
                handle: () => of(testData),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toEqual(testData);
                    expect(result.success).toBe(true);
                    done();
                },
            });
        });

        it('should wrap string data in standard format', (done) => {
            const testData = 'Simple string response';
            const mockCallHandler: CallHandler = {
                handle: () => of(testData),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toBe(testData);
                    expect(result.success).toBe(true);
                    done();
                },
            });
        });

        it('should wrap null data in standard format', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of(null),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toBeNull();
                    expect(result.success).toBe(true);
                    done();
                },
            });
        });

        it('should wrap undefined data in standard format', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of(undefined),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toBeUndefined();
                    expect(result.success).toBe(true);
                    done();
                },
            });
        });
    });

    describe('Already Formatted Response', () => {
        it('should not double-wrap if response already in IApiResponse format', (done) => {
            const alreadyFormatted = {
                success: true,
                message: 'Custom message',
                data: { test: 'data' },
                timestamp: new Date().toISOString(),
                statusCode: 201,
            };

            const mockCallHandler: CallHandler = {
                handle: () => of(alreadyFormatted),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toEqual(alreadyFormatted);
                    expect(result.message).toBe('Custom message');
                    expect(result.statusCode).toBe(201);
                    done();
                },
            });
        });

        it('should preserve custom success flag', (done) => {
            const errorResponse = {
                success: false,
                message: 'Error occurred',
                error: 'Details',
                timestamp: new Date().toISOString(),
                statusCode: 400,
            };

            const mockCallHandler: CallHandler = {
                handle: () => of(errorResponse),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.success).toBe(false);
                    expect(result.error).toBe('Details');
                    done();
                },
            });
        });
    });

    describe('Response Metadata', () => {
        it('should include correct status code', (done) => {
            const mockContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue({ url: '/test' }),
                    getResponse: jest.fn().mockReturnValue({ statusCode: 201 }),
                }),
            } as unknown as ExecutionContext;

            const mockCallHandler: CallHandler = {
                handle: () => of({ data: 'test' }),
            };

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.statusCode).toBe(201);
                    done();
                },
            });
        });

        it('should include request path', (done) => {
            const mockContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue({ url: '/api/users/123' }),
                    getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
                }),
            } as unknown as ExecutionContext;

            const mockCallHandler: CallHandler = {
                handle: () => of({ data: 'test' }),
            };

            interceptor.intercept(mockContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.path).toBe('/api/users/123');
                    done();
                },
            });
        });

        it('should include valid timestamp', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of({ data: 'test' }),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.timestamp).toBeDefined();
                    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
                    done();
                },
            });
        });

        it('should have timestamp close to current time', (done) => {
            const beforeTime = Date.now();
            const mockCallHandler: CallHandler = {
                handle: () => of({ data: 'test' }),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    const afterTime = Date.now();
                    const responseTime = new Date(result.timestamp).getTime();

                    expect(responseTime).toBeGreaterThanOrEqual(beforeTime);
                    expect(responseTime).toBeLessThanOrEqual(afterTime);
                    done();
                },
            });
        });
    });

    describe('Complex Data Types', () => {
        it('should handle nested objects', (done) => {
            const complexData = {
                user: {
                    id: 1,
                    profile: {
                        name: 'John',
                        address: {
                            city: 'New York',
                            zip: '10001',
                        },
                    },
                },
            };

            const mockCallHandler: CallHandler = {
                handle: () => of(complexData),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toEqual(complexData);
                    expect(result.data.user.profile.address.city).toBe('New York');
                    done();
                },
            });
        });

        it('should handle arrays of objects', (done) => {
            const arrayData = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
            ];

            const mockCallHandler: CallHandler = {
                handle: () => of(arrayData),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toEqual(arrayData);
                    expect(Array.isArray(result.data)).toBe(true);
                    done();
                },
            });
        });

        it('should handle boolean values', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of(true),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toBe(true);
                    expect(typeof result.data).toBe('boolean');
                    done();
                },
            });
        });

        it('should handle numeric values', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of(42),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toBe(42);
                    expect(typeof result.data).toBe('number');
                    done();
                },
            });
        });

        it('should handle empty objects', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of({}),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toEqual({});
                    done();
                },
            });
        });

        it('should handle empty arrays', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of([]),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result.data).toEqual([]);
                    expect(Array.isArray(result.data)).toBe(true);
                    done();
                },
            });
        });
    });

    describe('Response Structure Validation', () => {
        it('should always have required fields', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of({ test: 'data' }),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(result).toHaveProperty('success');
                    expect(result).toHaveProperty('message');
                    expect(result).toHaveProperty('data');
                    expect(result).toHaveProperty('timestamp');
                    expect(result).toHaveProperty('statusCode');
                    expect(result).toHaveProperty('path');
                    done();
                },
            });
        });

        it('should have correct data types for all fields', (done) => {
            const mockCallHandler: CallHandler = {
                handle: () => of({ test: 'data' }),
            };

            interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
                next: (result) => {
                    expect(typeof result.success).toBe('boolean');
                    expect(typeof result.message).toBe('string');
                    expect(typeof result.timestamp).toBe('string');
                    expect(typeof result.statusCode).toBe('number');
                    expect(typeof result.path).toBe('string');
                    done();
                },
            });
        });
    });
});