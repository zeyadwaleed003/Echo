import { Module } from '@nestjs/common';
import { BlockedWordsService } from './blocked-words.service';
import { BlockedWordsController } from './blocked-words.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordRelationships } from './entities/word-relationship.entity';
import { BlockedWord } from './entities/blocked-word.entity';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { Account } from '../accounts/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WordRelationships,
      BlockedWord,
      Account,
      RefreshToken,
    ]),
    AuthModule,
    TokenModule,
  ],
  controllers: [BlockedWordsController],
  providers: [BlockedWordsService],
})
export class BlockedWordsModule {}
