import { SetMetadata } from '@nestjs/common';
import { IS_OPTIONAL_AUTH } from '../../modules/auth/auth.guard';

export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH, true);
