// common.module.ts
import { Module, Global, DynamicModule } from '@nestjs/common';
import { ResponseService } from './response/response.service';
import { CustomLoggerService } from './logging/logger.service';

export interface CommonModuleOptions {
    isGlobal?: boolean;
    serviceName?: string;
}

@Global()
@Module({})
export class CommonModule {
    static forRoot(options: CommonModuleOptions = {}): DynamicModule {
        const { isGlobal = true, serviceName } = options;

        if (serviceName) {
            process.env.SERVICE_NAME = serviceName;
        }

        return {
            module: CommonModule,
            global: isGlobal,
            providers: [
                ResponseService,
                {
                    provide: CustomLoggerService,
                    useFactory: () => new CustomLoggerService(serviceName)
                }
            ],
            exports: [ResponseService, CustomLoggerService]
        };
    }
}