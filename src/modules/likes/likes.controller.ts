import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

import { LikesService } from './likes.service';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from '../accounts/accounts.enums';
import { CreateLikeDto } from './dto/create-like.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { QueryString } from 'src/common/types/api.types';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';
import { IdDto } from 'src/common/dtos/id.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Like a post',
    description:
      'Create a new like on a post. Users cannot like posts from private accounts unless they follow them.',
  })
  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createLikeDto: CreateLikeDto) {
    const { account } = req;
    const { postId } = createLikeDto;
    return this.likesService.create(account!, postId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all likes (Admin only)',
    description:
      'Retrieve all likes in the system with filtering, sorting, and pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort fields (e.g., -createdAt)',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description: 'Fields to include',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() q: QueryString) {
    return this.likesService.findAll(q);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get likes for a specific post',
    description:
      'Retrieve all likes for a post. Full like details are only visible if authenticated and allowed to view. Returns only count if not authenticated or not allowed.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort fields (e.g., -createdAt)',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description: 'Fields to include',
  })
  @UseGuards(AuthGuard)
  @OptionalAuth()
  @Get('post/:id')
  findPostLikes(
    @Query() q: QueryString,
    @Req() req: Request,
    @Param() params: IdDto
  ) {
    const { account } = req;
    const { id } = params;
    return this.likesService.findPostLikes(q, id, account);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unlike a post',
    description: 'Remove a like from a post',
  })
  @UseGuards(AuthGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: Request, @Body() createLikeDto: CreateLikeDto) {
    const { account } = req;
    const { postId } = createLikeDto;

    return this.likesService.remove(account!, postId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user's likes",
    description:
      'Retrieve all likes made by the authenticated user. Only shows likes on posts from public accounts or private accounts the user follows.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort fields (e.g., -createdAt)',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description: 'Fields to include',
  })
  @UseGuards(AuthGuard)
  @Get('me')
  findUserLikes(@Req() req: Request, @Query() q: QueryString) {
    const { account } = req;
    return this.likesService.findUserLikes(account!, q);
  }
}
