import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '../auth/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../accounts/accounts.enums';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';
import { IdDto } from 'src/common/dtos/id.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('file', 4))
  async create(
    @Req() req: Request,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const { account } = req;
    return this.postsService.create(createPostDto, account!, files);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() q: any) {
    return this.postsService.findAll(q);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  findUserPosts(@Req() req: Request, @Query() q: any) {
    const { account } = req;
    return this.postsService.findUserPosts(account!, q);
  }

  @UseGuards(AuthGuard)
  @OptionalAuth()
  @Get(':id')
  findOne(@Param() params: IdDto, @Req() req: Request) {
    const { account } = req;
    return this.postsService.findOne(params.id, account);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 4))
  update(
    @Param() params: IdDto,
    @Req() req: Request,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const { account } = req;
    return this.postsService.update(params.id, account!, updatePostDto, files);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param() params: IdDto, @Req() req: Request) {
    const { account } = req;
    return this.postsService.remove(params.id, account!);
  }

  @UseGuards(AuthGuard)
  @OptionalAuth()
  @Get('account/:id')
  findAccountPosts(
    @Req() req: Request,
    @Param() params: IdDto,
    @Query() q: any
  ) {
    const { account } = req;
    return this.postsService.findAccountPosts(params.id, q, account);
  }
}
