import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { BlockedWordsService } from './blocked-words.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';
import { IdDto } from 'src/common/dtos/id.dto';

@Controller('blocked-words')
export class BlockedWordsController {
  constructor(private blockedWordsService: BlockedWordsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async block(@Body() dto: CreateBlockedWordDto, @Req() req: Request) {
    return await this.blockedWordsService.block(req.account!.id, dto.word);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(@Req() req: Request, @Param() dto: IdDto) {
    return await this.blockedWordsService.unblock(req.account!.id, dto.id);
  }
}
