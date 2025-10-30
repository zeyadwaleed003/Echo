import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from './accounts.enums';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountIdDto } from './dto/account-id.dto';
import { UpdateAccountAdminDto } from './dto/update-account-admin.dto';
import type { Request } from 'express';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return await this.accountService.create(createAccountDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async find(@Query() q: any) {
    console.log(q);
    return await this.accountService.find(q);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUserAccount(@Req() req: Request) {
    return await this.accountService.findCurrentUserAccount(req.account!);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  async updateMe(@Req() req: Request, @Body() updateMeDto: UpdateMeDto) {
    return await this.accountService.updateMe(req.account!, updateMeDto);
  }

  @Get(':id')
  async findById(@Param() params: AccountIdDto) {
    const { id } = params;
    return await this.accountService.findById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: AccountIdDto) {
    const { id } = params;
    return await this.accountService.delete(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param() params: AccountIdDto,
    @Body() updateAccountAdminDto: UpdateAccountAdminDto
  ) {
    const { id } = params;
    return await this.accountService.update(id, updateAccountAdminDto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/block')
  async block(@Param() params: AccountIdDto, @Req() req: Request) {
    return await this.accountService.block(req.account!.id, params.id);
  }
}
