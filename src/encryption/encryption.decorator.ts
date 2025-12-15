// encryption.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_ENCRYPTION_KEY = 'skipEncryption';
export const SkipEncryption = () => SetMetadata(SKIP_ENCRYPTION_KEY, true);

export const FORCE_ENCRYPTION_KEY = 'forceEncryption';
export const ForceEncryption = () => SetMetadata(FORCE_ENCRYPTION_KEY, true);