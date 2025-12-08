import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { BlockedWordsService } from './blocked-words.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';
import { IdDto } from 'src/common/dtos/id.dto';
import type { QueryString } from 'src/common/types/api.types';

@ApiTags('Blocked Words')
@ApiBearerAuth()
@Controller('blocked-words')
export class BlockedWordsController {
  constructor(private blockedWordsService: BlockedWordsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Block a word' })
  async block(@Body() dto: CreateBlockedWordDto, @Req() req: Request) {
    return await this.blockedWordsService.block(req.account!.id, dto.word);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a word' })
  async unblock(@Req() req: Request, @Param() dto: IdDto) {
    return await this.blockedWordsService.unblock(req.account!.id, dto.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current account blocked words' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  async getCurrentAccountBlockedWords(
    @Req() req: Request,
    @Query() q: QueryString
  ) {
    return await this.blockedWordsService.getCurrentAccountBlockedWords(
      req.account!.id,
      q
    );
  }
}
