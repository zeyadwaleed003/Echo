import { Module } from '@nestjs/common';
import { BlockedWordsService } from './blocked-words.service';
import { BlockedWordsController } from './blocked-words.controller';

@Module({
  controllers: [BlockedWordsController],
  providers: [BlockedWordsService],
})
export class BlockedWordsModule {}
