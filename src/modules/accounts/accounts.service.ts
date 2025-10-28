import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
import { APIResponse } from 'src/common/types/api.types';
import { hashCode } from 'src/common/utils/functions';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>
  ) {}

  async create(createAccountDto: CreateAccountDto) {
    if (createAccountDto.password)
      createAccountDto.password = await hashCode(createAccountDto.password);

    const account = this.accountsRepository.create(createAccountDto);

    await this.accountsRepository.save(account);

    // Remove sensitive fields
    const {
      password,
      verificationCode,
      verificationCodeExpiresAt,
      passwordResetCode,
      passwordResetCodeExpiresAt,
      ...sanitizedAccount
    } = account;

    const result: APIResponse = {
      message: 'Account created successfully',
      data: sanitizedAccount,
    };

    return result;
  }
}
