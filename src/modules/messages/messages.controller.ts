import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(AuthGuard)
  createMessage(@Req() req: Request, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(req.account!.id, dto);
  }
}
