import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { IdDto } from 'src/common/dtos/id.dto';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req: Request) {
    return this.bookmarksService.create(
      req.account!.id,
      createBookmarkDto.postId
    );
  }

  @Get()
  findAll() {
    return this.bookmarksService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.findOne(req.account!.id, idDto.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.remove(req.account!.id, idDto.id);
  }
}
