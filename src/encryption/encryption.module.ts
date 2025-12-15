// encryption.module.ts
import { Module, DynamicModule, Global } from '@nestjs/common';
import { EncryptionService, EncryptionConfig } from './encryption.service';

@Global()
@Module({})
export class EncryptionModule {
    static forRoot(config: EncryptionConfig): DynamicModule {
        return {
            module: EncryptionModule,
            global: true,
            providers: [
                {
                    provide: EncryptionService,
                    useFactory: () => new EncryptionService(config)
                }
            ],
            exports: [EncryptionService]
        };
    }
}