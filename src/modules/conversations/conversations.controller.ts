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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Create a new conversation',
    description:
      'Creates a direct (1-on-1) or group conversation. Group conversations require a name and can have up to 256 participants.',
  })
  @ApiConsumes('multipart/form-data')
  create(
    @UploadedFile(AvatarFilePipe)
    avatar: Express.Multer.File,
    @Body() dto: CreateConversationDto,
    @Req() req: Request
  ) {
    return this.conversationsService.create(req.account!, dto, avatar);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get conversation details',
    description:
      'Retrieves conversation information including members. User must be a member or admin.',
  })
  get(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.findById(req.account!, id);
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Add members to group',
    description:
      'Adds new members or re-adds previously removed members to a group conversation. Only group admins can perform this action.',
  })
  addMembersToGroup(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: ManageMembersDto
  ) {
    return this.conversationsService.addMembersToGroup(req.account!, id, dto);
  }

  @Delete(':id/members')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove members from group',
    description:
      'Removes members from a group conversation. Only group admins can perform this action.',
  })
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
  @ApiOperation({
    summary: 'Leave group conversation',
    description:
      'Leaves a group conversation. If the leaving member is the only admin, the oldest member is automatically promoted.',
  })
  leaveGroup(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.leaveGroup(req.account!, id);
  }

  @Post(':id/promote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Promote member to admin',
    description:
      'Promotes a group member to admin role. Only existing admins can promote members.',
  })
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
  @ApiOperation({
    summary: 'Toggle conversation pin',
    description:
      'Pins or unpins a conversation for the current user. Pinned conversations appear at the top of the conversation list.',
  })
  togglePin(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.togglePin(req.account!, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle conversation archive',
    description:
      'Archives or unarchives a conversation for the current user. Archived conversations are hidden from the main conversation list.',
  })
  toggleArchive(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.toggleArchive(req.account!, id);
  }

  @Post(':id/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mute conversation',
    description:
      'Mutes notifications for a conversation. Can be muted indefinitely or until a specific date.',
  })
  muteConversation(
    @Req() req: Request,
    @Param() { id }: UuidDto,
    @Body() dto: MuteConversationDto
  ) {
    return this.conversationsService.muteConversation(req.account!, id, dto);
  }

  @Post(':id/unmute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unmute conversation',
    description: 'Unmutes notifications for a conversation.',
  })
  @ApiResponse({ status: 400, description: 'Conversation not muted' })
  unmuteConversation(@Req() req: Request, @Param() { id }: UuidDto) {
    return this.conversationsService.unmuteConversation(req.account!, id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Update conversation details',
    description:
      'Updates conversation name, description, or avatar. Only group admins can update conversation details.',
  })
  @ApiConsumes('multipart/form-data')
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
