import { Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Like } from './entities/like.entity';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { Account } from '../accounts/entities/account.entity';
import { APIResponse, QueryString } from 'src/common/types/api.types';
import { RelationshipHelper } from 'src/common/helpers/relationship.helper';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    private readonly relationshipHelper: RelationshipHelper
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

  findOne(id: number) {
    return `This action returns a #${id} like`;
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
}
