import { Controller, Get } from '@nestjs/common';
import { HttpResponse } from 'src/common/types/api.types';

@Controller({
  version: '', // disable the versioning for this route
  path: 'health',
})
export class HealthController {
  @Get()
  check() {
    const res: HttpResponse = {
      message: 'ᗧ···ᗣ···ᗣ··',
      timestamp: new Date().toISOString(),
    };

    return res;
  }
}
