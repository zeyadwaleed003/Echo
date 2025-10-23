import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from './accounts.enums';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountsService) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return await this.accountService.create(createAccountDto);
  }
}
