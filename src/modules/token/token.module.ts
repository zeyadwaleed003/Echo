import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [JwtModule, TypeOrmModule.forFeature([RefreshToken])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
