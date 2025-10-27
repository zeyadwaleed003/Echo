import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'auth.cleanup.revoked-refresh-tokens',
    timeZone: 'Africa/Cairo',
  })
  async handleCleanupRevokedRefreshTokens() {
    const month = 30 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - month);

    const result = await this.refreshTokenRepository.delete({
      revokedAt: LessThan(cutoff),
    });

    this.logger.log(
      `Cleaned up ${result.affected} revoked refresh tokens older than 30 days`
    );
  }
}
