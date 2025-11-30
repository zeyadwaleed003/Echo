import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../accounts/accounts.enums';
import { NotificationsService } from './notifications.service';
import type { QueryString } from 'src/common/types/api.types';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { IdDto } from 'src/common/dtos/id.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({
    summary: 'Get all notifications (Admin only)',
    description:
      'Retrieve all notifications in the system with filtering, sorting, and pagination support.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort by field (prefix with - for descending)',
    example: '-createdAt',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description: 'Comma-separated list of fields to include',
    example: 'id,type,description,isRead',
  })
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get()
  find(@Query() q: QueryString) {
    return this.notificationsService.find(q);
  }

  @ApiOperation({
    summary: 'Get current user notifications',
    description:
      'Retrieve all notifications for the authenticated user with filtering and pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort by field (prefix with - for descending)',
    example: '-createdAt',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description: 'Comma-separated list of fields to include',
    example: 'id,type,description,isRead',
  })
  @ApiQuery({
    name: 'isRead',
    required: false,
    type: Boolean,
    description: 'Filter by read status',
    example: false,
  })
  @UseGuards(AuthGuard)
  @Get('me')
  findCurrentAccountNotifications(
    @Req() req: Request,
    @Query() q: QueryString
  ) {
    return this.notificationsService.findCurrentAccountNotifications(
      req.account!.id,
      q
    );
  }

  @ApiOperation({
    summary: 'Get unread notifications count',
    description:
      'Retrieve the number of unread notifications for the authenticated user. This endpoint uses Redis caching for optimal performance.',
  })
  @UseGuards(AuthGuard)
  @Get('me/unread-count')
  getUnreadNotificationsCound(@Req() req: Request) {
    return this.notificationsService.getUnreadCount(req.account!.id);
  }

  @ApiOperation({
    summary: 'Mark notification as read',
    description:
      'Mark a specific notification as read. The notification must belong to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Notification ID',
    example: 123,
  })
  @UseGuards(AuthGuard)
  @Patch(':id/mark-as-read')
  markAsRead(@Req() req: Request, @Param() dto: IdDto) {
    return this.notificationsService.markAsRead(req.account!.id, dto.id);
  }

  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Mark all unread notifications as read for the authenticated user. This operation updates all unread notifications in a single database query.',
  })
  @UseGuards(AuthGuard)
  @Post('mark-all-as-read')
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead(req.account!.id);
  }
}
