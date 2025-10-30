import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
import { APIResponse } from 'src/common/types/api.types';
import { hashCode } from 'src/common/utils/functions';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { instanceToPlain } from 'class-transformer';

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

  async get(q: any) {
    const accounts = await new ApiFeatures<Account>(this.accountsRepository, q)
      .filter()
      .limitFields()
      .sort()
      .paginate()
      .exec();

    // Add a Serialization step: convert a class instance (a complex object in memory) into a simple, plain format (like JSON) that can be easily sent over a network.
    // This will add a security layer. I don't trust the client to select whatever field he wants (security vulnerability)!
    const safeAccounts = instanceToPlain(accounts);

    const result: APIResponse = {
      size: safeAccounts.length,
      data: safeAccounts,
    };

    return result;
  }
}
