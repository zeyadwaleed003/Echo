import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { TokenModule } from '../token/token.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, RefreshToken]), TokenModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
