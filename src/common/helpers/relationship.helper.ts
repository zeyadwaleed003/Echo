import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { AccountRelationships } from 'src/modules/accounts/entities/account-relationship.entity';
import { Post } from 'src/modules/posts/entities/post.entity';
import { RelationshipType } from 'src/modules/accounts/accounts.enums';
import { PostType } from 'src/modules/posts/posts.enums';

@Injectable()
export class RelationshipHelper {
  constructor(
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>
  ) {}

  async checkRelationship(
    account: Account,
    targetAccount: Account,
    action: string
  ) {
    if (account.id === targetAccount.id || account.role === 'admin') return;

    const [relationActor, relationTarget] = await Promise.all([
      this.accountRelationshipsRepository.findOne({
        where: { actorId: account.id, targetId: targetAccount.id },
      }),
      this.accountRelationshipsRepository.findOne({
        where: { targetId: account.id, actorId: targetAccount.id },
      }),
    ]);

    await this.checkBlockRelationship(
      relationActor?.relationshipType,
      relationTarget?.relationshipType,
      targetAccount,
      action
    );

    if (
      targetAccount.isPrivate &&
      relationActor?.relationshipType !== RelationshipType.FOLLOW
    ) {
      throw new ForbiddenException(
        `You must follow @${targetAccount.username} to ${action}`
      );
    }

    return { relationActor, relationTarget };
  }

  async validateActionPost(actionPostId: number, type?: PostType) {
    const actionPost = await this.postRepository.findOne({
      where: { id: actionPostId },
    });
    if (!actionPost) {
      throw new NotFoundException('No post found with this id');
    }

    const targetAccount = await this.accountRepository.findOne({
      where: { id: actionPost.accountId },
    });
    if (!targetAccount) {
      throw new NotFoundException('Post author account not found');
    }

    if (type === PostType.REPOST && targetAccount.isPrivate) {
      throw new ForbiddenException(
        `Cannot repost posts from private accounts.`
      );
    }

    return { actionPost, targetAccount };
  }

  async checkBlockRelationship(
    relationActorType: RelationshipType | undefined,
    relationTargetType: RelationshipType | undefined,
    targetAccount: Account,
    action: string
  ) {
    if (relationActorType === RelationshipType.BLOCK) {
      throw new ForbiddenException(
        `You have blocked @${targetAccount.username}. Unblock them to ${action} their post.`
      );
    }

    if (relationTargetType === RelationshipType.BLOCK) {
      throw new ForbiddenException(
        `You cannot ${action} this post because @${targetAccount.username} has blocked you.`
      );
    }
  }
}
