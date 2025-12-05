import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarFilePipe } from 'src/common/pipes/avatar-file.pipe';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  create(
    @UploadedFile(AvatarFilePipe)
    avatar: Express.Multer.File,
    @Body() dto: CreateConversationDto,
    @Req() req: Request
  ) {
    return this.conversationsService.create(req.account!, dto, avatar);
  }
}
