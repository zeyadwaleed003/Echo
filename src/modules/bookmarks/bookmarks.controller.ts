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
  Query,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { IdDto } from 'src/common/dtos/id.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../accounts/accounts.enums';
import type { QueryString } from 'src/common/types/api.types';

@Controller('bookmarks')
@UseGuards(AuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req: Request) {
    return this.bookmarksService.create(
      req.account!.id,
      createBookmarkDto.postId
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Query() q: QueryString) {
    return this.bookmarksService.findAll(q);
  }

  @Get('me')
  findCurrentUserBookmarks(@Query() q: QueryString, @Req() req: Request) {
    return this.bookmarksService.findCurrentUserBookmarks(req.account!.id, q);
  }

  @Get(':id')
  findOne(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.findOne(req.account!.id, idDto.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.remove(req.account!.id, idDto.id);
  }
}
