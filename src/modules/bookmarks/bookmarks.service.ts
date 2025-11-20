import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { APIResponse } from 'src/common/types/api.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { RelationshipType } from '../accounts/accounts.enums';
import { Bookmark } from './entities/bookmark.entity';
import { PostFiles } from '../posts/entities/post-file.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(PostFiles)
    private readonly postFilesRepository: Repository<PostFiles>
  ) {}

  // This creates a bookmark for a reply, repost, post
  async create(accountId: number, postId: number): Promise<APIResponse> {
    // Check if available post
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['account'],
    });
    if (!post)
      throw new NotFoundException(
        `No post, reply, or repost found with the provided id`
      );

    // Check if the current user is the same user created the post
    if (accountId !== post.accountId) {
      // if not the same user ... check the relationship

      // Can't bookmark a post for someone you blocked or blocked you!
      const isBlocked = await this.accountRelationshipsRepository.exists({
        where: [
          {
            actorId: accountId,
            targetId: post.accountId,
            relationshipType: RelationshipType.BLOCK,
          },
          {
            actorId: post.accountId,
            targetId: accountId,
            relationshipType: RelationshipType.BLOCK,
          },
        ],
      });
      if (isBlocked)
        throw new BadRequestException(
          'You cannot bookmark this post because a block exists between you and the author'
        );

      // If account is private ... need to check if I follow this account
      if (post.account.isPrivate) {
        const isFollowing = await this.accountRelationshipsRepository.existsBy({
          actorId: accountId,
          targetId: post.accountId,
          relationshipType: RelationshipType.FOLLOW,
        });

        if (!isFollowing)
          throw new BadRequestException(
            'You must follow this private account before you can bookmark its posts, replies, or reposts'
          );
      }
    }

    // Check if this post was bookmarked before by the same user
    const isBookmarked = await this.bookmarkRepository.existsBy({
      postId,
      bookmarkedById: accountId,
    });
    if (isBookmarked)
      throw new ConflictException(
        'You cannot bookmark a post, reply, or repost you have been bookmarked before'
      );

    const bookmark = this.bookmarkRepository.create({
      postId,
      bookmarkedById: accountId,
    });
    await this.bookmarkRepository.save(bookmark);

    const postFiles = await this.postFilesRepository.findBy({ postId });

    return {
      data: {
        ...bookmark,
        post,
        postFiles,
      },
    };
  }

  findAll() {
    return `This action returns all bookmarks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bookmark`;
  }

  update(id: number, updateBookmarkDto: UpdateBookmarkDto) {
    return `This action updates a #${id} bookmark`;
  }

  async remove(accountId: number, id: number): Promise<APIResponse> {
    const bookmark = await this.bookmarkRepository.findOneBy({
      id,
      bookmarkedById: accountId,
    });
    if (!bookmark)
      throw new NotFoundException(
        'No bookmark matching this id was found for your account'
      );

    await this.bookmarkRepository.remove(bookmark);

    return {
      message: 'Bookmark deleted successfully',
    };
  }
}
