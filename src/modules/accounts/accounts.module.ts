import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { TokenModule } from '../token/token.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AccountRelationships } from './entities/account-relationship.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, RefreshToken, AccountRelationships]),
    TokenModule,
    AuthModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
