import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  In,
  Not,
  Repository,
} from 'typeorm';
import { HttpResponse, QueryString } from 'src/common/types/api.types';
import { hashCode } from 'src/common/utils/functions';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { instanceToPlain } from 'class-transformer';
import { UpdateAccountAdminDto } from './dto/update-account-admin.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { AccountRelationships } from './entities/account-relationship.entity';
import {
  AccountStatus,
  DirectMessagingStatus,
  RelationshipDirection,
  RelationshipType,
} from './accounts.enums';
import { AuthService } from '../auth/auth.service';
import { SearchService } from '../search/search.service';
import { I18nService } from 'nestjs-i18n';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationType } from '../notifications/notifications.enums';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  private readonly i18nNamespace = 'messages.accounts';

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => SearchService))
    private readonly searchService: SearchService,
    private readonly i18n: I18nService,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<HttpResponse> {
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

    this.searchService.createAccountDocument(account);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.accountCreatedSuccessfully`),
      data: sanitizedAccount,
    };
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

    const result: HttpResponse = {
      size: safeAccounts.length,
      data: safeAccounts,
    };

    return result;
  }

  async findById(id: number) {
    const account = await this.accountsRepository.findOneBy({ id });
    if (!account)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.accountNotFound`)
      );

    const result: HttpResponse = {
      data: instanceToPlain(account),
    };

    return result;
  }

  async delete(id: number): Promise<HttpResponse> {
    await this.accountsRepository.delete({ id });

    this.logger.log(`Account deleted: id=${id}`);

    this.searchService.deleteAccountDocument(id);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.accountDeletedSuccessfully`),
    };
  }

  async update(
    id: number,
    updateAccountAdminDto: UpdateAccountAdminDto
  ): Promise<HttpResponse> {
    if (updateAccountAdminDto.password)
      updateAccountAdminDto.password = await hashCode(
        updateAccountAdminDto.password
      );

    await this.accountsRepository.update({ id }, updateAccountAdminDto);

    const account = await this.accountsRepository.findOneBy({ id });
    if (!account)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.accountNotFound`)
      );

    this.searchService.updateAccountDocument(account);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.accountUpdatedSuccessfully`),
      data: account,
    };
  }

  async findCurrentUserAccount(account: Account): Promise<HttpResponse> {
    const result: HttpResponse = {
      data: account,
    };

    return result;
  }

  async updateMe(account: Account, updateMeDto: UpdateMeDto) {
    const { id } = account;
    await this.accountsRepository.update({ id }, updateMeDto);

    const updatedAccount = await this.accountsRepository.findOneBy({ id });

    this.searchService.updateAccountDocument(account);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.accountUpdatedSuccessfully`),
      data: { ...updatedAccount },
    };
  }

  private async validateAndGetTargetAccount(
    accountId: number,
    targetAccountId: number,
    type: string
  ) {
    if (accountId === targetAccountId)
      throw new BadRequestException(
        this.i18n.t(
          `${this.i18nNamespace}.cannot${this.capitalizeFirstLetter(type)}Yourself`
        )
      );

    const targetAccount = await this.accountsRepository.findOne({
      where: {
        id: targetAccountId,
      },
      select: ['username', 'isPrivate'],
    });
    if (!targetAccount)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.accountNotFound`)
      );

    return targetAccount;
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
        this.i18n.t(`${this.i18nNamespace}.accountAlreadyBlocked`, {
          args: { username: targetAccount.username },
        })
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

    this.logger.log(
      `Account blocked: actor=${accountId}, target=${targetAccountId}`
    );

    const result: HttpResponse = {
      message: this.i18n.t(`${this.i18nNamespace}.accountBlockedSuccessfully`, {
        args: { username: targetAccount.username },
      }),
    };

    return result;
  }

  async unblock(
    accountId: number,
    targetAccountId: number
  ): Promise<HttpResponse> {
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
        this.i18n.t(`${this.i18nNamespace}.accountNotBlocked`, {
          args: { username: targetAccount.username },
        })
      );

    await this.accountRelationshipsRepository.delete({
      actorId: accountId,
      targetId: targetAccountId,
    });

    return {
      message: this.i18n.t(
        `${this.i18nNamespace}.accountUnblockedSuccessfully`,
        {
          args: { username: targetAccount.username },
        }
      ),
    };
  }

  private validateRelationshipType(relationship: AccountRelationships) {
    if (relationship.relationshipType === RelationshipType.BLOCK) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.cannotFollowBlockedAccount`)
      );
    }

    if (relationship.relationshipType === RelationshipType.FOLLOW) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.alreadyFollowing`)
      );
    }

    if (relationship.relationshipType === RelationshipType.FOLLOW_REQUEST) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.followRequestAlreadySent`)
      );
    }
  }

  async follow(
    account: Account,
    targetAccountId: number
  ): Promise<HttpResponse> {
    const targetAccount = await this.validateAndGetTargetAccount(
      account.id,
      targetAccountId,
      'follow'
    );

    // Check if the actor was blocked
    const isBlocked = await this.accountRelationshipsRepository.exists({
      where: {
        actorId: targetAccountId,
        targetId: account.id,
        relationshipType: RelationshipType.BLOCK,
      },
    });
    if (isBlocked)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.cannotFollowAccountThatBlockedYou`)
      );

    let relationship = await this.accountRelationshipsRepository.findOneBy({
      actorId: account.id,
      targetId: targetAccountId,
    });
    if (relationship) {
      this.validateRelationshipType(relationship);

      relationship.relationshipType = targetAccount.isPrivate
        ? RelationshipType.FOLLOW_REQUEST
        : RelationshipType.FOLLOW;

      await this.accountRelationshipsRepository.save(relationship);
    } else {
      relationship = this.accountRelationshipsRepository.create({
        actorId: account.id,
        targetId: targetAccountId,
        relationshipType: targetAccount.isPrivate
          ? RelationshipType.FOLLOW_REQUEST
          : RelationshipType.FOLLOW,
      });

      await this.accountRelationshipsRepository.save(relationship);
    }

    // Create a new follow notification
    const n: Partial<Notification> = {
      accountId: targetAccountId,
      actorId: account.id,
      type: targetAccount.isPrivate
        ? NotificationType.FR
        : NotificationType.FOLLOW,
      description: targetAccount.isPrivate
        ? `@${account.username} wants to follow you`
        : `@${account.username} started following you`,
    };
    this.notificationsService.create(n);

    return {
      message: targetAccount.isPrivate
        ? this.i18n.t(`${this.i18nNamespace}.followRequestSent`, {
            args: { username: targetAccount.username },
          })
        : this.i18n.t(`${this.i18nNamespace}.accountFollowedSuccessfully`, {
            args: { username: targetAccount.username },
          }),

      ...(targetAccount.isPrivate && { data: relationship }),
    };
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
        this.i18n.t(`${this.i18nNamespace}.notFollowingOrRequesting`)
      );

    await this.accountRelationshipsRepository.delete({
      actorId: accountId,
      targetId: targetAccountId,
    });

    const result: HttpResponse = {
      message:
        relationship.relationshipType === RelationshipType.FOLLOW_REQUEST
          ? this.i18n.t(`${this.i18nNamespace}.followRequestCancelled`, {
              args: { username: targetAccount.username },
            })
          : this.i18n.t(`${this.i18nNamespace}.accountUnfollowedSuccessfully`, {
              args: { username: targetAccount.username },
            }),
    };

    return result;
  }

  private async findRelatedAccounts(
    accountId: number,
    q: any,
    direction: RelationshipDirection,
    relationshipType: RelationshipType
  ) {
    const whereOption: FindOptionsWhere<AccountRelationships> =
      direction === RelationshipDirection.ACTOR
        ? { actorId: accountId, relationshipType }
        : { targetId: accountId, relationshipType };

    const relationships =
      await this.accountRelationshipsRepository.findBy(whereOption);

    let result: HttpResponse = {
      size: 0,
      data: [],
    };
    if (!relationships.length) return result;

    const ids = relationships.map((id) =>
      direction === RelationshipDirection.ACTOR ? id.targetId : id.actorId
    );
    const queryOptions: FindManyOptions<Account> = {
      where: ids.map((id) => ({ id })),
    };

    const accounts = await new ApiFeatures(
      this.accountsRepository,
      q,
      queryOptions
    )
      .sort()
      .limitFields()
      .paginate()
      .exec();

    result = {
      size: accounts.length,
      data: accounts,
    };

    return result;
  }

  async findBlockedAccounts(accountId: number, q: QueryString) {
    return await this.findRelatedAccounts(
      accountId,
      q,
      RelationshipDirection.ACTOR,
      RelationshipType.BLOCK
    );
  }

  async findCurrentUserFollowers(accountId: number, q: any) {
    return await this.findRelatedAccounts(
      accountId,
      q,
      RelationshipDirection.TARGET,
      RelationshipType.FOLLOW
    );
  }

  async findCurrentUserFollowings(accountId: number, q: any) {
    return await this.findRelatedAccounts(
      accountId,
      q,
      RelationshipDirection.ACTOR,
      RelationshipType.FOLLOW
    );
  }

  private async findRelatedAccountsById(
    accountId: number,
    targetAccountId: number,
    q: any,
    direction: RelationshipDirection,
    relationshipType: RelationshipType = RelationshipType.FOLLOW
  ) {
    if (accountId === targetAccountId)
      return await this.findRelatedAccounts(
        accountId,
        q,
        direction,
        relationshipType
      );

    const targetAccount = await this.accountsRepository.findOne({
      where: {
        id: targetAccountId,
      },
      select: ['isPrivate'],
    });
    if (!targetAccount)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.accountNotFound`)
      );

    // Check if the current account is blocked
    const isBlocked = await this.accountRelationshipsRepository.exists({
      where: {
        actorId: targetAccountId,
        targetId: accountId,
        relationshipType: RelationshipType.BLOCK,
      },
    });
    if (isBlocked) {
      this.logger.warn(
        `Access denied - blocked: viewer=${accountId}, target=${targetAccountId}`
      );
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.noPermissionToView`)
      );
    }

    if (targetAccount.isPrivate) {
      const relationship = await this.accountRelationshipsRepository.findOneBy({
        actorId: accountId,
        targetId: targetAccountId,
        relationshipType: RelationshipType.FOLLOW,
      });

      if (!relationship) {
        this.logger.warn(
          `Access denied - private account: viewer=${accountId}, target=${targetAccountId}`
        );
        throw new ForbiddenException(
          this.i18n.t(`${this.i18nNamespace}.privateAccountFollowRequired`)
        );
      }
    }

    return await this.findRelatedAccounts(
      targetAccountId,
      q,
      direction,
      relationshipType
    );
  }

  async findAccountFollowingsById(
    accountId: number,
    targetAccountId: number,
    q: any
  ) {
    return await this.findRelatedAccountsById(
      accountId,
      targetAccountId,
      q,
      RelationshipDirection.ACTOR
    );
  }

  async findAccountFollowersById(
    accountId: number,
    targetAccountId: number,
    q: any
  ) {
    return await this.findRelatedAccountsById(
      accountId,
      targetAccountId,
      q,
      RelationshipDirection.TARGET
    );
  }

  async deactivate(account: Account) {
    account.status = AccountStatus.DEACTIVATED;
    await this.accountsRepository.save(account);

    this.searchService.updateAccountDocument(account);

    // Logout the user from all devices
    await this.authService.logoutFromAllDevices(account.id);

    this.logger.log(`Account deactivated: id=${account.id}`);

    const result: HttpResponse = {
      message: this.i18n.t(
        `${this.i18nNamespace}.accountDeactivatedSuccessfully`
      ),
    };

    return result;
  }

  async acceptFollowRequest(
    account: Account,
    requestId: number
  ): Promise<HttpResponse> {
    const relationship = await this.accountRelationshipsRepository.findOneBy({
      id: requestId,
      targetId: account.id,
      relationshipType: RelationshipType.FOLLOW_REQUEST,
    });
    if (!relationship)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.followRequestNotFound`)
      );

    relationship.relationshipType = RelationshipType.FOLLOW;
    await this.accountRelationshipsRepository.save(relationship);

    // Notify the requester that their follow request was accepted
    const n: Partial<Notification> = {
      accountId: relationship.actorId,
      actorId: account.id,
      type: NotificationType.FR_ACC,
      description: `@${account.username} accepted your follow request`,
    };
    this.notificationsService.create(n);

    return {
      message: this.i18n.t(`${this.i18nNamespace}.followRequestAccepted`),
    };
  }

  async refuseFollowRequest(accountId: number, requestId: number) {
    const relationship = await this.accountRelationshipsRepository.findOneBy({
      id: requestId,
      targetId: accountId,
      relationshipType: RelationshipType.FOLLOW_REQUEST,
    });
    if (!relationship)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}.followRequestNotFound`)
      );

    await this.accountRelationshipsRepository.remove(relationship);

    const result: HttpResponse = {
      message: this.i18n.t(`${this.i18nNamespace}.followRequestRefused`),
    };

    return result;
  }

  async findFollowRequests(accountId: number, q: any): Promise<HttpResponse> {
    const whereClause: FindOptionsWhere<AccountRelationships> = {
      targetId: accountId,
      relationshipType: RelationshipType.FOLLOW_REQUEST,
    };

    const queryOptions: FindManyOptions<AccountRelationships> = {
      where: whereClause,
      relations: ['actor'],
      select: ['id', 'actor', 'createdAt'],
    };

    const relationships = await new ApiFeatures(
      this.accountRelationshipsRepository,
      q,
      queryOptions
    )
      .sort()
      .paginate()
      .exec();

    return {
      size: relationships.length,
      data: relationships,
    };
  }

  async deleteMe(accountId: number): Promise<HttpResponse> {
    await this.accountsRepository.delete({ id: accountId });

    this.logger.log(`Account self-deleted: id=${accountId}`);

    this.searchService.deleteAccountDocument(accountId);
    return {
      message: this.i18n.t(`${this.i18nNamespace}.accountSelfDeleted`),
    };
  }

  async removeFollower(accountId: number, followerId: number) {
    const followerAccount = await this.validateAndGetTargetAccount(
      accountId,
      followerId,
      'remove'
    );

    const relationship = await this.accountRelationshipsRepository.findOne({
      where: {
        actorId: followerId,
        targetId: accountId,
        relationshipType: RelationshipType.FOLLOW,
      },
    });

    if (!relationship)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.accountNotFollowingYou`, {
          args: { username: followerAccount.username },
        })
      );

    await this.accountRelationshipsRepository.remove(relationship);

    this.logger.log(
      `Follower removed: account=${accountId}, follower=${followerId}`
    );

    const result: HttpResponse = {
      message: this.i18n.t(
        `${this.i18nNamespace}.followerRemovedSuccessfully`,
        {
          args: { username: followerAccount.username },
        }
      ),
    };

    return result;
  }

  async getBlockedAccountIds(accountId: number | undefined) {
    if (!accountId) return [];

    const relationships = await this.accountRelationshipsRepository.find({
      where: [
        { actorId: accountId, relationshipType: RelationshipType.BLOCK },
        { targetId: accountId, relationshipType: RelationshipType.BLOCK },
      ],
    });

    const blockedIds = new Set<number>();
    relationships.forEach((r) => {
      r.actorId === accountId
        ? blockedIds.add(r.targetId)
        : blockedIds.add(r.actorId);
    });

    return Array.from(blockedIds);
  }

  async getFollowingAccountIds(accountId: number | undefined) {
    if (!accountId) return [];

    const following = await this.accountRelationshipsRepository.find({
      where: {
        actorId: accountId,
        relationshipType: RelationshipType.FOLLOW,
      },
    });

    return following.map((rel) => rel.targetId);
  }

  async fetchRelationships(
    accountId: number | undefined,
    targetIds: number[]
  ): Promise<{
    outgoingMap: Map<number, RelationshipType>;
    incomingMap: Map<number, RelationshipType>;
  }> {
    if (!accountId || targetIds.length === 0)
      return { outgoingMap: new Map(), incomingMap: new Map() };

    // me to them
    const outgoingRelationships =
      await this.accountRelationshipsRepository.findBy({
        actorId: accountId,
        targetId: In(targetIds),
      });

    // them to me
    const incomingRelationships =
      await this.accountRelationshipsRepository.findBy({
        actorId: In(targetIds),
        targetId: accountId,
      });

    const outgoingMap = new Map(
      outgoingRelationships.map((o) => [o.targetId, o.relationshipType])
    );

    const incomingMap = new Map(
      incomingRelationships.map((o) => [o.actorId, o.relationshipType])
    );

    return { outgoingMap, incomingMap };
  }

  // If U want to know the relationship between the current user and the provided account
  getRelationshipType(
    accountId: number | undefined,
    relationshipsMap: Map<number | undefined, RelationshipType>
  ) {
    return relationshipsMap.get(accountId) || null;
  }

  async findAccountsByIds(ids: number[]) {
    return await this.accountsRepository.findBy({
      id: In(ids),
    });
  }

  async validateConversationParticipants(
    manager: EntityManager,
    admin: Account,
    participantIds: number[]
  ) {
    const dmStatus = [DirectMessagingStatus.EVERYONE];
    if (admin.isVerified) dmStatus.push(DirectMessagingStatus.VERIFIED);

    const [validParticipants, blockExists] = await Promise.all([
      // Check if a user doesn't accept direct messages from me because of the directMessaging config
      manager.getRepository(Account).findBy([
        {
          id: In(participantIds),
          directMessaging: In(dmStatus),
          status: AccountStatus.ACTIVATED,
        },
      ]),
      ,
      // Check if a user doesn't accept direct messages from me because of a block
      manager.getRepository(AccountRelationships).existsBy([
        {
          actorId: In(participantIds),
          targetId: admin.id,
          relationshipType: RelationshipType.BLOCK,
        },
        {
          actorId: admin.id,
          targetId: In(participantIds),
          relationshipType: RelationshipType.BLOCK,
        },
      ]),
    ]);

    if (validParticipants.length !== participantIds.length || blockExists)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.UserCannotReceiveMessage`)
      );

    return validParticipants;
  }

  async findByIds(ids: number[]) {
    return await this.accountsRepository.findBy({ id: In(ids) });
  }
}
