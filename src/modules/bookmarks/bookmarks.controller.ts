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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@Controller('bookmarks')
@UseGuards(AuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bookmark' })
  create(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req: Request) {
    return this.bookmarksService.create(
      req.account!.id,
      createBookmarkDto.postId
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBody({ type: CreateBookmarkDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiOperation({ summary: 'Get all bookmarks (Admin only)' })
  findAll(@Query() q: QueryString) {
    return this.bookmarksService.findAll(q);
  }

  @Get('me')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiOperation({ summary: 'Get current user bookmarks' })
  findCurrentUserBookmarks(@Query() q: QueryString, @Req() req: Request) {
    return this.bookmarksService.findCurrentUserBookmarks(req.account!.id, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bookmark by id' })
  findOne(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.findOne(req.account!.id, idDto.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bookmark' })
  remove(@Param() idDto: IdDto, @Req() req: Request) {
    return this.bookmarksService.remove(req.account!.id, idDto.id);
  }
}
