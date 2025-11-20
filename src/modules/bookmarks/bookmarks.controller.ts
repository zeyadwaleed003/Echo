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
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createBookmarkDto: CreateBookmarkDto,
    @Req() req: Request
  ) {
    return await this.bookmarksService.create(
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
  remove(@Param('id') id: string) {
    return this.bookmarksService.remove(+id);
  }
}
