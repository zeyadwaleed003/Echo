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
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { AuthGuard } from "../auth/auth.guard";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "../accounts/accounts.enums";
import { OptionalAuth } from "src/common/decorators/optionalAuth.decorator";
import { IdDto } from "src/common/dtos/id.dto";
import { CreateReplyDto } from "./dto/create-reply.dto";
import type { QueryString } from "src/common/types/api.types";
import { CreateRepostDto } from "./dto/create-repost.dto";
import { UploadConfig } from "src/config/upload.config";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({
    summary: "Create a new post",
    description:
      "Create a new post with optional file attachments (max 4 files)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Post content (max 280 characters)",
          example: "Just setting up my Echo account! 🚀",
          maxLength: 280,
        },
        file: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "Optional file attachments (max 4 files)",
        },
      },
      required: ["content"],
    },
  })
  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor(
      "file",
      UploadConfig.maxFilesPerPost,
      UploadConfig.multerOptions
    )
  )
  create(
    @Req() req: Request,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const { account } = req;
    return this.postsService.createPost(createPostDto, account!, files);
  }

  @ApiOperation({
    summary: "Get all posts (Admin only)",
    description:
      "Retrieve all posts with filtering, sorting, and pagination. Admin access required.",
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number for pagination",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of items per page",
    example: 10,
  })
  @ApiQuery({
    name: "sort",
    required: false,
    description: "Sort field (e.g., -createdAt for descending)",
    example: "-createdAt",
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description: "Fields to include (comma-separated)",
    example: "id,content,createdAt",
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() q: QueryString) {
    return this.postsService.findAllPosts(q);
  }

  @ApiOperation({
    summary: "Get current user posts",
    description:
      "Retrieve all posts created by the authenticated user, with filtering, sorting, and pagination",
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("/me")
  findUserPosts(@Req() req: Request, @Query() q: QueryString) {
    const { account } = req;
    return this.postsService.findUserPosts(account!, q);
  }

  @ApiOperation({
    summary: "Get post by ID",
    description:
      "Retrieve a single post by its ID. Authentication is optional. Private posts require authentication and following the author.",
  })
  @ApiParam({ name: "id", description: "Post ID", example: 1 })
  @UseGuards(AuthGuard)
  @OptionalAuth()
  @Get("/:id")
  findOne(@Param() params: IdDto, @Req() req: Request) {
    const { account } = req;
    return this.postsService.findOne(params.id, account);
  }

  @ApiOperation({
    summary: "Update a post",
    description:
      "Update post content, add new files (max 4 total), or delete existing files. Only post owner can update.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "Post ID", example: 1 })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Updated post content",
          example: "Updated my post content!",
        },
        deleteFileIds: {
          type: "array",
          items: { type: "number" },
          description: "Array of file IDs to delete",
          example: [1, 2],
        },
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "New files to upload",
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @Patch("/:id")
  @UseInterceptors(
    FilesInterceptor(
      "file",
      UploadConfig.maxFilesPerPost,
      UploadConfig.multerOptions
    )
  )
  update(
    @Param() params: IdDto,
    @Req() req: Request,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const { account } = req;
    return this.postsService.update(params.id, account!, updatePostDto, files);
  }

  @ApiOperation({
    summary: "Delete a post",
    description:
      "Permanently delete a post and all its files. Only post owner can delete.",
  })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "Post ID", example: 1 })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("/:id")
  remove(@Param() params: IdDto, @Req() req: Request) {
    const { account } = req;
    return this.postsService.remove(params.id, account!);
  }

  @ApiOperation({
    summary: "Get posts by account",
    description:
      "Retrieve posts from a specific account, with filtering, sorting, and pagination. Authentication is optional. Private accounts require following or authentication.",
  })
  @ApiParam({ name: "id", description: "Account ID", example: 123 })
  @UseGuards(AuthGuard)
  @OptionalAuth()
  @Get("/account/:id")
  findAccountPosts(
    @Req() req: Request,
    @Param() params: IdDto,
    @Query() q: QueryString
  ) {
    const { account } = req;
    return this.postsService.findAccountPosts(params.id, q, account);
  }

  @ApiOperation({
    summary: "Pin your post",
    description:
      "Pin your post to your profile. Automatically unpins your previously pinned post. Only one post can be pinned at a time. You can only pin posts that you created.",
  })
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "Post ID to pin", example: 1 })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("/:id/pin")
  pinPost(@Param() params: IdDto, @Req() req: Request) {
    const { account } = req;
    return this.postsService.pinPost(account!, params.id);
  }

  @ApiOperation({
    summary: "Reply to a post",
    description:
      "Create a reply to a post with optional file attachments (max 4 files). Must follow private account authors to reply.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "Parent post ID", example: 1 })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Reply content (max 280 characters)",
          example: "Great post! Thanks for sharing.",
          maxLength: 280,
        },
        file: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "Optional file attachments (max 4 files)",
        },
      },
      required: ["content"],
    },
  })
  @UseGuards(AuthGuard)
  @Post("/:id/replies")
  @UseInterceptors(
    FilesInterceptor(
      "file",
      UploadConfig.maxFilesPerPost,
      UploadConfig.multerOptions
    )
  )
  createReply(
    @Req() req: Request,
    @Param() params: IdDto,
    @Body() createReplyDto: CreateReplyDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const { account } = req;
    return this.postsService.createReply(
      account!,
      params.id,
      createReplyDto,
      files
    );
  }

  @ApiOperation({
    summary: "Get post replies",
    description:
      "Retrieve all replies to a specific post, with filtering, sorting, and pagination. Authentication is optional. Filters out replies from private accounts (unless following), muted, or blocked users.",
  })
  @ApiParam({ name: "id", description: "Post ID", example: 1 })
  @UseGuards(AuthGuard)
  @OptionalAuth()
  @Get("/:id/replies")
  getPostReplies(
    @Req() req: Request,
    @Param() params: IdDto,
    @Query() q: QueryString
  ) {
    const { id } = params;
    const { account } = req;
    return this.postsService.getPostReplies(id, q, account);
  }

  @ApiOperation({
    summary: "Get post bookmarks count",
    description: "Get the number of bookmarks for a specific post",
  })
  @ApiParam({
    name: "id",
    description: "Post ID",
    example: 1,
  })
  @Get("/:id/bookmarks/count")
  getPostBookmarks(@Param() params: IdDto) {
    const { id } = params;
    return this.postsService.getPostBookmarks(id);
  }

  @ApiOperation({
    summary: "Repost a post",
    description: `Repost a post with optional file attachments (max 4 files), optional content. Cannot repost a private account's post.`,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiParam({ name: "id", description: "Parent post ID", example: 1 })
  @UseGuards(AuthGuard)
  @Post("/:id/reposts")
  @UseInterceptors(
    FilesInterceptor(
      "file",
      UploadConfig.maxFilesPerPost,
      UploadConfig.multerOptions
    )
  )
  createRepost(
    @Req() req: Request,
    @Param() params: IdDto,
    @Body() createRepostDto: CreateRepostDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const { account } = req;
    return this.postsService.createRepost(
      account!,
      params.id,
      createRepostDto,
      files
    );
  }
}
