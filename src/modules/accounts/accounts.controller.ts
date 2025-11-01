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
import { IdDto } from '../../common/dtos/id.dto';
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

  @UseGuards(AuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@Req() req: Request) {
    return await this.accountService.deleteMe(req.account!.id);
  }

  @UseGuards(AuthGuard)
  @Get('me/followers')
  async findCurrentUserFollowers(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findCurrentUserFollowers(
      req.account!.id,
      q
    );
  }

  @UseGuards(AuthGuard)
  @Get('me/followings')
  async findCurrentUserFollowings(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findCurrentUserFollowings(
      req.account!.id,
      q
    );
  }

  @UseGuards(AuthGuard)
  @Get('me/blocked')
  async findBlockedAccounts(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findBlockedAccounts(req.account!.id, q);
  }

  @UseGuards(AuthGuard)
  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Req() req: Request) {
    return await this.accountService.deactivate(req.account!);
  }

  @UseGuards(AuthGuard)
  @Get('me/follow-requests')
  async findFollowRequests(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findFollowRequests(req.account!.id, q);
  }

  @UseGuards(AuthGuard)
  @Post('follow-requests/:id')
  async acceptFollowRequest(@Req() req: Request, @Param() params: IdDto) {
    return await this.accountService.acceptFollowRequest(
      req.account!.id,
      params.id
    );
  }

  @UseGuards(AuthGuard)
  @Delete('follow-requests/:id')
  async refuseFollowRequest(@Req() req: Request, @Param() params: IdDto) {
    return await this.accountService.refuseFollowRequest(
      req.account!.id,
      params.id
    );
  }

  @Get(':id')
  async findById(@Param() params: IdDto) {
    const { id } = params;
    return await this.accountService.findById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: IdDto) {
    const { id } = params;
    return await this.accountService.delete(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param() params: IdDto,
    @Body() updateAccountAdminDto: UpdateAccountAdminDto
  ) {
    const { id } = params;
    return await this.accountService.update(id, updateAccountAdminDto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/block')
  async block(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.block(req.account!.id, params.id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.unblock(req.account!.id, params.id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/follow')
  async follow(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.follow(req.account!.id, params.id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.unfollow(req.account!.id, params.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/followings')
  async findAccountFollowingsById(
    @Req() req: Request,
    @Param() params: IdDto,
    @Query() q: any
  ) {
    return await this.accountService.findAccountFollowingsById(
      req.account!.id,
      params.id,
      q
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id/followers')
  async findAccountFollowersById(
    @Req() req: Request,
    @Param() params: IdDto,
    @Query() q: any
  ) {
    return await this.accountService.findAccountFollowersById(
      req.account!.id,
      params.id,
      q
    );
  }
}
