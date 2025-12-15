// exception.filter.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from './exception.filter';
import { CustomLoggerService } from '../logging/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { NotFoundException, BadRequestException } from './custom-exceptions';

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let logger: CustomLoggerService;

    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockImplementation(() => ({
        json: mockJson,
    }));
    const mockGetResponse = jest.fn().mockImplementation(() => ({
        status: mockStatus,
    }));
    const mockGetRequest = jest.fn().mockImplementation(() => ({
        url: '/test-url',
        method: 'GET',
    }));
    const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
    }));

    const mockArgumentsHost = {
        switchToHttp: mockHttpArgumentsHost,
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        getType: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
    } as unknown as ArgumentsHost;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GlobalExceptionFilter,
                {
                    provide: CustomLoggerService,
                    useValue: {
                        setContext: jest.fn(),
                        error: jest.fn(),
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
        logger = module.get<CustomLoggerService>(CustomLoggerService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    describe('HTTP Exception Handling', () => {
        it('should handle basic HttpException', () => {
            const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

            filter.catch(exception, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    statusCode: 404,
                    message: 'Not Found',
                    timestamp: expect.any(String),
                    path: '/test-url',
                    method: 'GET',
                })
            );
        });

        it('should handle HttpException with object response', () => {
            const exception = new HttpException(
                { message: 'Bad Request', errorCode: 'INVALID_INPUT' },
                HttpStatus.BAD_REQUEST
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    statusCode: 400,
                    message: 'Bad Request',
                    errorCode: 'INVALID_INPUT',
                })
            );
        });

        it('should handle custom exceptions', () => {
            const exception = new NotFoundException('User not found');

            filter.catch(exception, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    statusCode: 404,
                    message: 'User not found',
                    errorCode: 'NOT_FOUND',
                })
            );
        });

        it('should include details from custom exceptions', () => {
            const exception = new BadRequestException('Validation failed', {
                fields: ['email', 'password'],
            });

            filter.catch(exception, mockArgumentsHost);

            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.objectContaining({
                        fields: ['email', 'password'],
                    }),
                })
            );
        });
    });

    describe('Standard Error Handling', () => {
        it('should handle standard Error objects', () => {
            const exception = new Error('Something went wrong');

            filter.catch(exception, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    statusCode: 500,
                    message: 'Something went wrong',
                })
            );
        });

        it('should include error name and stack in details', () => {
            const exception = new TypeError('Type error occurred');

            filter.catch(exception, mockArgumentsHost);

            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.objectContaining({
                        name: 'TypeError',
                    }),
                })
            );
        });

        it('should hide stack trace in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const exception = new Error('Production error');

            filter.catch(exception, mockArgumentsHost);

            const callArg = mockJson.mock.calls[0][0];
            expect(callArg.details?.stack).toBeUndefined();

            process.env.NODE_ENV = originalEnv;
        });

        it('should show stack trace in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const exception = new Error('Development error');

            filter.catch(exception, mockArgumentsHost);

            const callArg = mockJson.mock.calls[0][0];
            expect(callArg.details?.stack).toBeDefined();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Unknown Exception Handling', () => {
        it('should handle unknown exception types', () => {
            const exception = 'String error';

            filter.catch(exception, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    statusCode: 500,
                    message: 'Internal server error',
                })
            );
        });

        it('should handle null exceptions', () => {
            filter.catch(null, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(500);
        });

        it('should handle undefined exceptions', () => {
            filter.catch(undefined, mockArgumentsHost);

            expect(mockStatus).toHaveBeenCalledWith(500);
        });
    });

    describe('Logging', () => {
        it('should log errors', () => {
            const exception = new Error('Test error');

            filter.catch(exception, mockArgumentsHost);

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('GET /test-url - 500'),
                expect.any(String)
            );
        });

        it('should log error message with context', () => {
            const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

            filter.catch(exception, mockArgumentsHost);

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Not Found'),
                undefined
            );
        });

        it('should log stack trace for Error objects', () => {
            const exception = new Error('Error with stack');

            filter.catch(exception, mockArgumentsHost);

            expect(logger.error).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('Error: Error with stack')
            );
        });
    });

    describe('Response Format', () => {
        it('should always include required fields', () => {
            const exception = new Error('Test');

            filter.catch(exception, mockArgumentsHost);

            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: expect.any(Boolean),
                    statusCode: expect.any(Number),
                    message: expect.any(String),
                    errorCode: expect.any(String),
                    timestamp: expect.any(String),
                    path: expect.any(String),
                    method: expect.any(String),
                })
            );
        });

        it('should format timestamp correctly', () => {
            const exception = new Error('Test');

            filter.catch(exception, mockArgumentsHost);

            const callArg = mockJson.mock.calls[0][0];
            expect(new Date(callArg.timestamp).toString()).not.toBe('Invalid Date');
        });

        it('should include request method and path', () => {
            const exception = new Error('Test');

            filter.catch(exception, mockArgumentsHost);

            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    path: '/test-url',
                    method: 'GET',
                })
            );
        });

        it('should set success to false', () => {
            const exception = new Error('Test');

            filter.catch(exception, mockArgumentsHost);

            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });
    });

    describe('Status Code Mapping', () => {
        it('should use correct status code for different exceptions', () => {
            const testCases = [
                { exception: new HttpException('Bad Request', 400), expectedStatus: 400 },
                { exception: new HttpException('Unauthorized', 401), expectedStatus: 401 },
                { exception: new HttpException('Forbidden', 403), expectedStatus: 403 },
                { exception: new HttpException('Not Found', 404), expectedStatus: 404 },
                { exception: new Error('Internal Error'), expectedStatus: 500 },
            ];

            testCases.forEach(({ exception, expectedStatus }) => {
                jest.clearAllMocks();
                filter.catch(exception, mockArgumentsHost);
                expect(mockStatus).toHaveBeenCalledWith(expectedStatus);
            });
        });
    });
});