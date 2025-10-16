import { Controller, Get } from '@nestjs/common';
import { APIResponse } from 'src/common/types/api.types';

@Controller({
  version: '', // disable the versioning for this route
  path: 'health',
})
export class HealthController {
  @Get()
  check() {
    const res: APIResponse = {
      status: 'OK',
      message: 'ᗧ···ᗣ···ᗣ··',
      timestamp: new Date().toISOString(),
    };

    return res;
  }
}
