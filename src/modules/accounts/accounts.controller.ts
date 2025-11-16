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
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from './accounts.enums';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { IdDto } from '../../common/dtos/id.dto';
import { UpdateAccountAdminDto } from './dto/update-account-admin.dto';
import type { Request, Response } from 'express';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountsService) {}

  @ApiOperation({ summary: 'Create a new account (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return await this.accountService.create(createAccountDto);
  }

  @ApiOperation({ summary: 'Get all accounts with filtering (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of accounts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async find(@Query() q: any) {
    return await this.accountService.find(q);
  }

  @ApiOperation({ summary: 'Get current user account' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user account details',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUserAccount(@Req() req: Request) {
    return await this.accountService.findCurrentUserAccount(req.account!);
  }

  @ApiOperation({ summary: 'Update current user account' })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('me')
  async updateMe(@Req() req: Request, @Body() updateMeDto: UpdateMeDto) {
    return await this.accountService.updateMe(req.account!, updateMeDto);
  }

  @ApiOperation({ summary: 'Delete current user account permanently' })
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@Req() req: Request) {
    return await this.accountService.deleteMe(req.account!.id);
  }

  @ApiOperation({ summary: 'Get current user followers' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of followers',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me/followers')
  async findCurrentUserFollowers(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findCurrentUserFollowers(
      req.account!.id,
      q
    );
  }

  @ApiOperation({ summary: 'Get current user followings' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of accounts you follow',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me/followings')
  async findCurrentUserFollowings(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findCurrentUserFollowings(
      req.account!.id,
      q
    );
  }

  @ApiOperation({ summary: 'Get blocked accounts' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of blocked accounts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me/blocked')
  async findBlockedAccounts(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findBlockedAccounts(req.account!.id, q);
  }

  @ApiOperation({ summary: 'Remove a follower from your account' })
  @ApiResponse({
    status: 204,
    description: 'Follower removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'This account is not following you',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Follower account ID to remove' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('me/followers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFollower(@Req() req: Request, @Param() params: IdDto) {
    return await this.accountService.removeFollower(req.account!.id, params.id);
  }

  @ApiOperation({ summary: 'Deactivate current user account' })
  @ApiResponse({
    status: 200,
    description:
      'Account deactivated successfully. Can be reactivated by logging in.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('me/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.accountService.deactivate(req.account!);

    res.clearCookie('refreshToken');
    return result;
  }

  @ApiOperation({ summary: 'Get all follow requests for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of pending follow requests',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me/follow-requests')
  async findFollowRequests(@Req() req: Request, @Query() q: any) {
    return await this.accountService.findFollowRequests(req.account!.id, q);
  }

  @ApiOperation({ summary: 'Accept a follow request' })
  @ApiResponse({
    status: 200,
    description: 'Follow request accepted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Follow request not found' })
  @ApiParam({ name: 'id', description: 'Follow request ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('follow-requests/:id')
  async acceptFollowRequest(@Req() req: Request, @Param() params: IdDto) {
    return await this.accountService.acceptFollowRequest(
      req.account!.id,
      params.id
    );
  }

  @ApiOperation({ summary: 'Refuse/reject a follow request' })
  @ApiResponse({
    status: 200,
    description: 'Follow request refused successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Follow request not found' })
  @ApiParam({ name: 'id', description: 'Follow request ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('follow-requests/:id')
  async refuseFollowRequest(@Req() req: Request, @Param() params: IdDto) {
    return await this.accountService.refuseFollowRequest(
      req.account!.id,
      params.id
    );
  }

  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns account details',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @Get(':id')
  async findById(@Param() params: IdDto) {
    const { id } = params;
    return await this.accountService.findById(id);
  }

  @ApiOperation({ summary: 'Delete account by ID (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() params: IdDto) {
    const { id } = params;
    return await this.accountService.delete(id);
  }

  @ApiOperation({ summary: 'Update account by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiBearerAuth()
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

  @ApiOperation({ summary: 'Block an account' })
  @ApiResponse({
    status: 200,
    description: 'Account blocked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot block yourself or already blocked',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID to block' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/block')
  async block(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.block(req.account!.id, params.id);
  }

  @ApiOperation({ summary: 'Unblock an account' })
  @ApiResponse({
    status: 204,
    description: 'Account unblocked successfully',
  })
  @ApiResponse({ status: 400, description: 'Account is not blocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID to unblock' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.unblock(req.account!.id, params.id);
  }

  @ApiOperation({ summary: 'Follow an account or send follow request' })
  @ApiResponse({
    status: 200,
    description: 'Account followed or follow request sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot follow yourself or already following',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID to follow' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/follow')
  async follow(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.follow(req.account!.id, params.id);
  }

  @ApiOperation({ summary: 'Unfollow an account or cancel follow request' })
  @ApiResponse({
    status: 204,
    description: 'Account unfollowed or follow request cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Not following this account' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID to unfollow' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(@Param() params: IdDto, @Req() req: Request) {
    return await this.accountService.unfollow(req.account!.id, params.id);
  }

  @ApiOperation({ summary: 'Get accounts that a specific user follows' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of accounts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Private account - follow required',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
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

  @ApiOperation({ summary: 'Get followers of a specific account' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of followers',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Private account - follow required',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'fields', required: false })
  @ApiBearerAuth()
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
