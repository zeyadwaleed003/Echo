import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { EmailModule } from '../email/email.module';
import { TokenModule } from '../token/token.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, RefreshToken]),
    EmailModule,
    TokenModule,
    forwardRef(() => SearchModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
