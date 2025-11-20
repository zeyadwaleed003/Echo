import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
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
  findOne(@Param('id') id: string) {
    return this.bookmarksService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookmarkDto: UpdateBookmarkDto
  ) {
    return this.bookmarksService.update(+id, updateBookmarkDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.remove(req.account!.id, idDto.id);
  }
}
