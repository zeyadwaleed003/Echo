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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { IdDto } from 'src/common/dtos/id.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get()
  find(@Query() q: QueryString) {
    return this.notificationsService.find(q);
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me/unread-count')
  getUnreadNotificationsCound(@Req() req: Request) {
    return this.notificationsService.getUnreadCount(req.account!.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id/mark-as-read')
  markAsRead(@Req() req: Request, @Param() dto: IdDto) {
    return this.notificationsService.markAsRead(req.account!.id, dto.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('mark-all-as-read')
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead(req.account!.id);
  }
}
