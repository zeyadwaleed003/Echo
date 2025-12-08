import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarFilePipe } from 'src/common/pipes/avatar-file.pipe';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsService } from './conversations.service';
import { UuidDto } from 'src/common/dtos/uuid.dto';
import { ManageMembersDto } from './dto/manage-members.dto';
import { PromoteMemberDto } from './dto/promote-member.dto';
import { MuteConversationDto } from './dto/mute-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  create(
    @UploadedFile(AvatarFilePipe)
    avatar: Express.Multer.File,
    @Body() dto: CreateConversationDto,
    @Req() req: Request
  ) {
    return this.conversationsService.create(req.account!, dto, avatar);
  }

  @Get(':id')
  get(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.findById(req.account!, id);
  }

  @Post(':id/members')
  addMembersToGroup(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: ManageMembersDto
  ) {
    return this.conversationsService.addMembersToGroup(req.account!, id, dto);
  }

  @Delete(':id/members')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMembersFromGroup(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: ManageMembersDto
  ) {
    return this.conversationsService.removeMembersFromGroup(
      req.account!,
      id,
      dto
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveGroup(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.leaveGroup(req.account!, id);
  }

  @Post(':id/promote')
  @HttpCode(HttpStatus.OK)
  promoteMember(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: PromoteMemberDto
  ) {
    return this.conversationsService.promoteMemberToAdmin(
      req.account!,
      id,
      dto
    );
  }

  @Post(':id/pin')
  @HttpCode(HttpStatus.OK)
  togglePin(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.togglePin(req.account!, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  toggleArchive(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.toggleArchive(req.account!, id);
  }

  @Post(':id/mute')
  @HttpCode(HttpStatus.OK)
  muteConversation(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: MuteConversationDto
  ) {
    return this.conversationsService.muteConversation(req.account!, id, dto);
  }

  @Post(':id/unmute')
  @HttpCode(HttpStatus.OK)
  unmuteConversation(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.unmuteConversation(req.account!, id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  updateConversation(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: UpdateConversationDto,
    @UploadedFile(AvatarFilePipe) avatar: Express.Multer.File
  ) {
    return this.conversationsService.updateConversation(
      req.account!,
      id,
      dto,
      avatar
    );
  }
}
