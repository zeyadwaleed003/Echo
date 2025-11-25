import { BadRequestException, Injectable } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { APIResponse } from 'src/common/types/api.types';
import { SearchFilter } from './search.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { ILike, LessThanOrEqual, Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { PostFiles } from '../posts/entities/post-file.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostFiles)
    private readonly postFilesRepository: Repository<PostFiles>
  ) {}

  private decodeCursor(cursor: string | undefined) {
    if (!cursor) return;

    let decoded: string;
    try {
      decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    } catch {
      throw new BadRequestException('Invalid cursor format');
    }

    const id = Number(decoded);
    if (Number.isNaN(id) || id < 0)
      throw new BadRequestException('Invalid cursor value');

    return id;
  }

  private encodeCursor(id: number): string {
    return Buffer.from(id.toString(), 'utf-8').toString('base64');
  }

  private assignNextCursor<T extends { id: number }>(
    result: T[],
    resultLength: number,
    limit: number
  ) {
    if (resultLength > limit)
      return this.encodeCursor(result[resultLength - 1]!.id);

    return null;
  }

  // This works perfectly fine
  private async searchAccounts(
    id: number | undefined,
    q: string,
    limit: number
  ) {
    const accounts = await this.accountRepository.find({
      where: [
        {
          username: ILike(`%${q}%`),
          ...(id ? { id: LessThanOrEqual(id) } : {}),
        },
        {
          name: ILike(`%${q}%`),
          ...(id ? { id: LessThanOrEqual(id) } : {}),
        },
      ],
      order: { id: 'DESC' },
      take: limit + 1,
    });

    // Assign next cursor
    const nextCursor = this.assignNextCursor<Account>(
      accounts,
      accounts.length,
      limit
    );

    const paginatedAccounts = accounts.slice(0, limit);

    return {
      size: paginatedAccounts.length,
      data: paginatedAccounts,
      nextCursor,
    };
  }

  private async searchLatestPosts(
    id: number | undefined,
    q: string,
    limit: number
  ) {
    // Get matching posts
    const posts = await this.postRepository.find({
      where: {
        content: ILike(`%${q}%`),
        ...(id ? { id: LessThanOrEqual(id) } : {}),
      },
      relations: ['account', 'actionPost'],
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });

    // Assign next cursor
    const nextCursor = this.assignNextCursor<Post>(posts, posts.length, limit);

    // Paginated posts is the limited number of posts without the extra post
    const paginatedPosts = posts.slice(0, limit);

    // Get and assign the files of each post
    const postsFilesPromises = paginatedPosts.map(
      async (p) => await this.postFilesRepository.findBy({ postId: p.id })
    );
    const postsFiles = await Promise.all(postsFilesPromises);

    const postsWithFiles = paginatedPosts.map((p, i) => ({
      ...p,
      postFiles: postsFiles[i],
    }));

    return {
      size: postsWithFiles.length,
      data: postsWithFiles,
      nextCursor,
    };
  }

  async search(query: SearchQueryDto): Promise<APIResponse> {
    const { f, q, cursor, limit } = query;

    // decode the given cursor
    const id = this.decodeCursor(cursor);

    switch (f) {
      case SearchFilter.USER:
        // Search in account table to find any matching accounts
        return this.searchAccounts(id, q, limit);
      case SearchFilter.LIVE:
        // Search through the latest posts
        return this.searchLatestPosts(id, q, limit);
    }

    return {};
  }
}
