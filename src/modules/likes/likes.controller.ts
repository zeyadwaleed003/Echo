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
} from '@nestjs/common';
import type { Request } from 'express';

import { LikesService } from './likes.service';
import { AuthGuard } from '../auth/auth.guard';
import { Role } from '../accounts/accounts.enums';
import { CreateLikeDto } from './dto/create-like.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { QueryString } from 'src/common/types/api.types';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createLikeDto: CreateLikeDto) {
    const { account } = req;
    const { postId } = createLikeDto;
    return this.likesService.create(account!, postId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() q: QueryString) {
    return this.likesService.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likesService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Delete('')
  remove(@Req() req: Request, @Body() createLikeDto: CreateLikeDto) {
    const { account } = req;
    const { postId } = createLikeDto;

    return this.likesService.remove(account!, postId);
  }
}
