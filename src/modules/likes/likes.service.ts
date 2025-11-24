import { In, Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Like } from './entities/like.entity';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { Account } from '../accounts/entities/account.entity';
import { APIResponse, QueryString } from 'src/common/types/api.types';
import { RelationshipHelper } from 'src/common/helpers/relationship.helper';
import { RelationshipType } from '../accounts/accounts.enums';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';

@Injectable()
export class LikesService {
  constructor(
    private readonly relationshipHelper: RelationshipHelper,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>
  ) {}

  async create(account: Account, postId: number): Promise<APIResponse> {
    const accounts = await this.relationshipHelper.validateActionPost(postId);
    await this.relationshipHelper.checkRelationship(
      account,
      accounts.targetAccount,
      'like'
    );

    const isLiked = await this.likeRepository.findOneBy({
      accountId: account.id,
      postId,
    });
    if (isLiked)
      throw new BadRequestException('You have already liked this post');

    const like = this.likeRepository.create({
      accountId: account.id,
      postId,
    });
    await this.likeRepository.save(like);

    return {
      message: 'You have successfully liked this post',
      data: like,
    };
  }

  async findAll(q: QueryString): Promise<APIResponse> {
    const likes = await new ApiFeatures<Like>(this.likeRepository, q, {
      relations: ['account'],
    })
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .exec();

    return {
      size: likes.length,
      data: likes,
    };
  }

  async findPostLikes(
    q: QueryString,
    postId: number,
    account?: Account
  ): Promise<APIResponse> {
    const accounts = await this.relationshipHelper.validateActionPost(postId);

    const queryString = { ...q, postId };
    const likes = await new ApiFeatures<Like>(
      this.likeRepository,
      queryString,
      {
        relations: ['account'],
      }
    )
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .exec();

    const res: APIResponse = {
      size: likes.length,
    };

    if (!account) return res;
    this.relationshipHelper.checkRelationship(
      account,
      accounts.targetAccount,
      'view likes'
    );

    res.data = likes;

    return res;
  }

  async remove(account: Account, postId: number): Promise<APIResponse> {
    const result = await this.likeRepository.delete({
      accountId: account.id,
      postId,
    });
    if (!result.affected)
      throw new BadRequestException('You have not liked this post');

    return {
      message: 'Like deleted successfully',
    };
  }

  async findUserLikes(account: Account, q: QueryString): Promise<APIResponse> {
    const queryString = { ...q, accountId: account.id };
    const likes = await new ApiFeatures<Like>(
      this.likeRepository,
      queryString,
      {
        relations: ['post'],
      }
    )
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .exec();

    if (!likes.length) {
      return { size: 0, data: [] };
    }

    console.log(likes[0]?.post);
    const accountsIds = [...new Set(likes.map((like) => like.post.accountId))];

    const privateAccounts = await this.accountsRepository.find({
      where: { id: In(accountsIds), isPrivate: true },
      select: ['id'],
    });
    const privateAccountsIds = new Set(privateAccounts.map((acc) => acc.id));

    const privateFollowedAccounts =
      privateAccountsIds.size > 0
        ? await this.accountRelationshipsRepository.find({
            select: ['targetId'],
            where: {
              actorId: account.id,
              targetId: In([...privateAccountsIds]),
              relationshipType: RelationshipType.FOLLOW,
            },
          })
        : [];

    const privateFollowedAccountsIds = new Set(
      privateFollowedAccounts.map((rel) => rel.targetId)
    );

    const visibleLikes = likes.filter((like) => {
      const accountId = like.post.accountId;

      if (accountId === account.id || !privateAccountsIds.has(accountId))
        return true;

      return privateFollowedAccountsIds.has(accountId);
    });

    return { size: likes.length, data: visibleLikes };
  }
}
