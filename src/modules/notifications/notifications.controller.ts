import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '../accounts/accounts.enums';
import { NotificationsService } from './notifications.service';
import type { QueryString } from 'src/common/types/api.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

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
}
