import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Account } from '../accounts/entities/account.entity';
import { AccountStatus } from '../accounts/accounts.enums';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>
  ) {}

  private readonly month = 30 * 24 * 60 * 60 * 1000;
  private readonly cutoff = new Date(Date.now() - this.month);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'auth.cleanup.revoked-refresh-tokens',
    timeZone: 'Africa/Cairo',
  })
  async handleCleanupRevokedRefreshTokens() {
    const result = await this.refreshTokenRepository.delete({
      revokedAt: LessThan(this.cutoff),
    });

    this.logger.log(
      `Cleaned up ${result.affected} revoked refresh tokens older than 30 days`
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'accounts.cleanup.deactivated-accounts',
    timeZone: 'Africa/Cairo',
  })
  async handleCleanupDeactivatedAccounts() {
    const result = await this.accountRepository.delete({
      status: AccountStatus.DEACTIVATED,
      updatedAt: LessThan(this.cutoff),
    });

    this.logger.log(
      `Cleaned up ${result.affected} accounts deactivated for more than 30 days`
    );
  }
}
