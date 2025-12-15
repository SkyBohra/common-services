<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">Common Services Library</h1>

<p align="center">
  Reusable common services library for NestJS microservices with encryption, logging, response handling, and exception management.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@skybohra/common-services" target="_blank"><img src="https://img.shields.io/npm/v/@skybohra/common-services.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@skybohra/common-services" target="_blank"><img src="https://img.shields.io/npm/l/@skybohra/common-services.svg" alt="Package License" /></a>
  <a href="https://github.com/SkyBohra/common-services" target="_blank"><img src="https://img.shields.io/badge/github-SkyBohra%2Fcommon--services-blue" alt="GitHub" /></a>
</p>

## 📋 Overview

A comprehensive NestJS library providing production-ready services for:

- 🔐 **Encryption/Decryption** - Secure data encryption with configurable keys
- 📝 **Logging** - Structured logging with Winston integration
- 📤 **Response Handling** - Standardized API response format
- ⚠️ **Exception Management** - Global exception filtering and custom exceptions
- 🎯 **Decorators** - Useful decorators for common operations

## 🚀 Installation

```bash
npm install @skybohra/common-services
```

## 📖 Documentation

For detailed usage instructions, API references, and examples, please refer to the [Wiki](https://github.com/SkyBohra/common-services/wiki).

## 🔧 Configuration

Common Services Library can be easily configured to suit your application's needs. Here's a basic example:

```typescript
import { Module } from '@nestjs/common';
import { CommonServicesModule } from '@skybohra/common-services';

@Module({
  imports: [
    CommonServicesModule.forRoot({
      encryptionKey: 'your-encryption-key',
      logLevel: 'debug',
    }),
  ],
})
export class AppModule {}
```

## 🎉 Features

- **EncryptionService**: Encrypt and decrypt data using AES-256-CBC.
- **LoggingService**: Log messages with different severity levels (debug, info, warn, error).
- **ResponseService**: Send standardized JSON responses with success and error formats.
- **ExceptionFilter**: Global exception filter to catch and handle exceptions.
- **Custom Decorators**: `@Encrypt()`, `@Log()`, `@Response()`, and `@Exception()` decorators for easy usage.

## 🚦 Usage

Here's a quick example demonstrating the usage of some features:

```typescript
import { Controller, Get, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseService, LoggingService, ExceptionFilter } from '@skybohra/common-services';

@Controller()
@UseFilters(ExceptionFilter)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly responseService: ResponseService,
    private readonly loggingService: LoggingService,
  ) {}

  @Get()
  getHello(): string {
    this.loggingService.log('Fetching hello world message');
    return this.responseService.success({ message: this.appService.getHello() });
  }
}
```

## 🧪 Testing

Common Services Library comes with built-in support for testing. Here's an example of a unit test for the `EncryptionService`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should encrypt and decrypt data', () => {
    const data = 'Hello World';
    const encryptedData = service.encrypt(data);
    const decryptedData = service.decrypt(encryptedData);

    expect(decryptedData).toEqual(data);
  });
});
```

## 🤝 Contributing

We welcome contributions to Common Services Library! Please read our [Contributing Guide](https://github.com/SkyBohra/common-services/blob/main/CONTRIBUTING.md) for details on how to contribute.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/SkyBohra/common-services/blob/main/LICENSE) file for details.

## 📞 Support

For support, please open an issue on the [GitHub repository](https://github.com/SkyBohra/common-services/issues) or contact the maintainer.

---

This README was generated with ❤️ by [NestJS CLI](https://docs.nestjs.com/cli/overview)
