import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { BlockedWordsService } from './blocked-words.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';

@Controller('blocked-words')
export class BlockedWordsController {
  constructor(private blockedWordsService: BlockedWordsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async blockWord(@Body() dto: CreateBlockedWordDto, @Req() req: Request) {
    return await this.blockedWordsService.blockWord(req.account!.id, dto.word);
  }
}
