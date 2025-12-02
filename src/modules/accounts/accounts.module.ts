import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AccountRelationships } from './entities/account-relationship.entity';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { TokenModule } from '../token/token.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, RefreshToken, AccountRelationships]),
    TokenModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SearchModule),
    NotificationsModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
