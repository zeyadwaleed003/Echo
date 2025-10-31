import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { DataSource, FindManyOptions, In, Not, Repository } from 'typeorm';
import { APIResponse, QueryString } from 'src/common/types/api.types';
import { hashCode } from 'src/common/utils/functions';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { instanceToPlain } from 'class-transformer';
import { UpdateAccountAdminDto } from './dto/update-account-admin.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { AccountRelationships } from './entities/account-relationship.entity';
import { RelationshipType } from './accounts.enums';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>,
    private readonly dataSource: DataSource
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

  async find(q: any) {
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

  async findById(id: number) {
    const account = await this.accountsRepository.findOneBy({ id });
    if (!account)
      throw new NotFoundException('No account found with the provided id');

    const result: APIResponse = {
      data: instanceToPlain(account),
    };

    return result;
  }

  async delete(id: number) {
    await this.accountsRepository.delete({ id });

    const result: APIResponse = {
      message: 'Account deleted successfully',
    };
    return result;
  }

  async update(id: number, updateAccountAdminDto: UpdateAccountAdminDto) {
    if (updateAccountAdminDto.password)
      updateAccountAdminDto.password = await hashCode(
        updateAccountAdminDto.password
      );

    await this.accountsRepository.update({ id }, updateAccountAdminDto);

    const account = await this.accountsRepository.findOneBy({ id });
    if (!account)
      throw new NotFoundException('No account found with the provided id');

    const result: APIResponse = {
      message: 'Account updated successfully',
      data: account,
    };

    return result;
  }

  async findCurrentUserAccount(account: Account) {
    const result: APIResponse = {
      data: account,
    };

    return result;
  }

  async updateMe(account: Account, updateMeDto: UpdateMeDto) {
    const { id } = account;
    await this.accountsRepository.update({ id }, updateMeDto);

    const updatedAccount = await this.accountsRepository.findOneBy({ id });
    if (!account)
      throw new NotFoundException('No account found with the provided id');

    const result: APIResponse = {
      message: 'Account updated successfully',
      data: { ...updatedAccount },
    };

    return result;
  }

  private async validateAndGetTargetAccount(
    accountId: number,
    targetAccountId: number,
    type: string
  ) {
    if (accountId === targetAccountId)
      throw new BadRequestException(`You cannot ${type} yourself`);

    // Check if the account we want to block existed
    const targetAccount = await this.accountsRepository.findOne({
      where: {
        id: targetAccountId,
      },
      select: ['username', 'isPrivate'],
    });
    if (!targetAccount)
      throw new NotFoundException('No account found with the provided id');

    return targetAccount;
  }

  async block(accountId: number, targetAccountId: number) {
    const targetAccount = await this.validateAndGetTargetAccount(
      accountId,
      targetAccountId,
      'block'
    );

    const relationship = await this.accountRelationshipsRepository.findOne({
      where: {
        actorId: accountId,
        targetId: targetAccountId,
      },
    });
    if (relationship?.relationshipType === RelationshipType.BLOCK)
      throw new ConflictException(
        `Account @${targetAccount.username} is already blocked`
      );

    await this.dataSource.transaction(async (manager) => {
      const relationshipRepo = manager.getRepository(AccountRelationships);

      // Check if existing relationship in the same order
      if (relationship) {
        relationship.relationshipType = RelationshipType.BLOCK;
        await relationshipRepo.save(relationship);
      } else {
        const block = relationshipRepo.create({
          actorId: accountId,
          targetId: targetAccountId,
          relationshipType: RelationshipType.BLOCK,
        });

        await relationshipRepo.save(block);
      }

      // Delete relationship in the opposite direction on if it is not block
      await relationshipRepo.delete({
        actorId: targetAccountId,
        targetId: accountId,
        relationshipType: Not(RelationshipType.BLOCK),
      });
    });

    const result: APIResponse = {
      message: `Account @${targetAccount.username} has been blocked successfully`,
    };

    return result;
  }

  async unblock(accountId: number, targetAccountId: number) {
    const targetAccount = await this.validateAndGetTargetAccount(
      accountId,
      targetAccountId,
      'unblock'
    );

    const relationship = await this.accountRelationshipsRepository.existsBy({
      actorId: accountId,
      targetId: targetAccountId,
      relationshipType: RelationshipType.BLOCK,
    });
    if (!relationship)
      throw new BadRequestException(
        `Account @${targetAccount.username} is not blocked`
      );

    await this.accountRelationshipsRepository.delete({
      actorId: accountId,
      targetId: targetAccountId,
    });

    const result: APIResponse = {
      message: `Account @${targetAccount.username} has been unblocked successfully`,
    };

    return result;
  }

  async findBlockedAccounts(id: number, q: QueryString) {
    const blockedAccountsIds = await this.accountRelationshipsRepository.find({
      where: { actorId: id, relationshipType: RelationshipType.BLOCK },
      select: ['targetId'],
    });

    const targetIds = blockedAccountsIds.map((bc) => bc.targetId);
    const queryOptions: FindManyOptions<Account> = {
      where: targetIds.map((id) => ({
        id,
      })),
    };

    const blockedAccounts = await new ApiFeatures(
      this.accountsRepository,
      q,
      queryOptions
    )
      .sort()
      .limitFields()
      .paginate()
      .exec();

    const result: APIResponse = {
      size: blockedAccounts.length,
      data: blockedAccounts,
    };

    return result;
  }

  private validateRelationshipType(relationship: AccountRelationships) {
    if (relationship.relationshipType === RelationshipType.BLOCK) {
      throw new BadRequestException(
        'You cannot follow an account you have blocked. Unblock them first'
      );
    }

    if (relationship.relationshipType === RelationshipType.FOLLOW) {
      throw new BadRequestException('You are already following this account');
    }

    if (relationship.relationshipType === RelationshipType.FOLLOW_REQUEST) {
      throw new BadRequestException(
        'You have already sent a follow request to this account'
      );
    }
  }

  async follow(accountId: number, targetAccountId: number) {
    const targetAccount = await this.validateAndGetTargetAccount(
      accountId,
      targetAccountId,
      'follow'
    );

    // Check if the actor was blocked
    const isBlocked = await this.accountRelationshipsRepository.exists({
      where: {
        actorId: targetAccountId,
        targetId: accountId,
        relationshipType: RelationshipType.BLOCK,
      },
    });
    if (isBlocked)
      throw new BadRequestException(
        'You cannot follow an account that has blocked you'
      );

    const relationship = await this.accountRelationshipsRepository.findOneBy({
      actorId: accountId,
      targetId: targetAccountId,
    });
    if (relationship) {
      this.validateRelationshipType(relationship);

      relationship.relationshipType = targetAccount.isPrivate
        ? RelationshipType.FOLLOW_REQUEST
        : RelationshipType.FOLLOW;

      await this.accountRelationshipsRepository.save(relationship);
    } else {
      const newRelationship = this.accountRelationshipsRepository.create({
        actorId: accountId,
        targetId: targetAccountId,
        relationshipType: targetAccount.isPrivate
          ? RelationshipType.FOLLOW_REQUEST
          : RelationshipType.FOLLOW,
      });

      await this.accountRelationshipsRepository.save(newRelationship);
    }

    const result: APIResponse = {
      message: targetAccount.isPrivate
        ? `Follow request sent to ${targetAccount.username} successfully`
        : `Account ${targetAccount.username} followed successfully`,
    };

    return result;
  }

  async unfollow(accountId: number, targetAccountId: number) {
    const targetAccount = await this.validateAndGetTargetAccount(
      accountId,
      targetAccountId,
      'unfollow'
    );

    // Check if I have followed this account or not
    const relationship = await this.accountRelationshipsRepository.findOne({
      where: {
        actorId: accountId,
        targetId: targetAccountId,
        relationshipType: In([
          RelationshipType.FOLLOW,
          RelationshipType.FOLLOW_REQUEST,
        ]),
      },
    });
    if (!relationship)
      throw new BadRequestException(
        'You are not following or requesting to follow this account'
      );

    await this.accountRelationshipsRepository.delete({
      actorId: accountId,
      targetId: targetAccountId,
    });

    const result: APIResponse = {
      message:
        relationship.relationshipType === RelationshipType.FOLLOW_REQUEST
          ? `Follow request to ${targetAccount.username} has been cancelled successfully`
          : `Account ${targetAccount.username} has been unfollowed successfully`,
    };

    return result;
  }
}
