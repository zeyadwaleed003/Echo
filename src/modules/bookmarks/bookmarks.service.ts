import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APIResponse, QueryString } from 'src/common/types/api.types';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { RelationshipType } from '../accounts/accounts.enums';
import { Bookmark } from './entities/bookmark.entity';
import { PostFiles } from '../posts/entities/post-file.entity';
import ApiFeatures from 'src/common/utils/ApiFeatures';

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

  // Very expensive
  async findAll(
    q: QueryString,
    qOptions?: FindManyOptions<Bookmark>
  ): Promise<APIResponse> {
    const queryOptions: FindManyOptions<Bookmark> = {
      ...qOptions,
      relations: ['post', 'bookmarkedBy'],
    };

    const bookmarks = await new ApiFeatures(
      this.bookmarkRepository,
      q,
      queryOptions
    )
      .paginate()
      .sort()
      .exec();

    const postsFilesPromises = bookmarks.map(
      async (b) => await this.postFilesRepository.findBy({ postId: b.postId })
    );
    const postsFiles = await Promise.all(postsFilesPromises);

    const bookmarksWithFiles = bookmarks.map((bookmark, index) => ({
      ...bookmark,
      postFiles: postsFiles[index],
    }));

    return {
      size: bookmarks.length,
      data: bookmarksWithFiles,
    };
  }

  async findCurrentUserBookmarks(
    accountId: number,
    q: QueryString
  ): Promise<APIResponse> {
    return await this.findAll(q, { where: { bookmarkedById: accountId } });
  }

  private async findSpecificBookmarkForUser(
    accountId: number,
    id: number,
    relations?: string[]
  ): Promise<Bookmark> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: {
        id,
        bookmarkedById: accountId,
      },
      ...(relations && { relations }),
    });
    if (!bookmark)
      throw new NotFoundException(
        'No bookmark matching this id was found for your account'
      );

    return bookmark;
  }

  async findOne(accountId: number, id: number): Promise<APIResponse> {
    const bookmark = await this.findSpecificBookmarkForUser(accountId, id, [
      'post',
      'bookmarkedBy',
    ]);

    const postFiles = await this.postFilesRepository.findBy({
      postId: bookmark.postId,
    });

    return {
      data: {
        ...bookmark,
        postFiles,
      },
    };
  }

  async remove(accountId: number, id: number): Promise<APIResponse> {
    const bookmark = await this.findSpecificBookmarkForUser(accountId, id);

    await this.bookmarkRepository.remove(bookmark);

    return {
      message: 'Bookmark deleted successfully',
    };
  }
}
