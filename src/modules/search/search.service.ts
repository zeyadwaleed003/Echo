import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { APIResponse } from 'src/common/types/api.types';
import { SearchFilter } from './search.enums';
import { Account } from '../accounts/entities/account.entity';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { estypes } from '@elastic/elasticsearch';
import { AccountIndex, PostIndex } from './search.types';
import { AccountStatus } from '../accounts/accounts.enums';
import { AccountsService } from '../accounts/accounts.service';
import { Post } from '../posts/entities/post.entity';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly POSTS_INDEX = 'posts';
  private readonly ACCOUNTS_INDEX = 'accounts';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountsService: AccountsService
  ) {}

  async onModuleInit() {
    await this.createIndices();
  }

  private async createIndices() {
    const accountsIndexExists = await this.elasticsearchService.indices.exists({
      index: this.ACCOUNTS_INDEX,
    });

    if (!accountsIndexExists)
      await this.elasticsearchService.indices.create({
        index: this.ACCOUNTS_INDEX,
        mappings: {
          properties: {
            id: { type: 'long' },
            username: { type: 'text', analyzer: 'standard' },
            name: { type: 'text', analyzer: 'standard' },
            status: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });

    const postsIndexExists = await this.elasticsearchService.indices.exists({
      index: this.POSTS_INDEX,
    });

    if (!postsIndexExists)
      await this.elasticsearchService.indices.create({
        index: this.POSTS_INDEX,
        mappings: {
          properties: {
            id: { type: 'long' },
            accountId: { type: 'long' },
            content: { type: 'text', analyzer: 'standard' },
            isPrivate: { type: 'boolean' },
            createdAt: { type: 'date' },
          },
        },
      });
  }

  private async createDocument<T extends { id: number }>(
    document: T,
    index: string
  ) {
    await this.elasticsearchService.create<T>({
      index,
      id: document.id.toString(),
      document,
    });
  }

  async createAccountDocument(account: Account) {
    const doc: AccountIndex = {
      id: account.id,
      username: account.username,
      name: account.name,
      status: account.status,
      createdAt: account.createdAt,
    };

    await this.createDocument<AccountIndex>(doc, this.ACCOUNTS_INDEX);
  }

  async createPostDocument(post: Post) {
    const doc: PostIndex = {
      id: post.id,
      accountId: post.accountId,
      content: post.content,
      isPrivate: post.account.isPrivate,
      createdAt: post.createdAt,
    };

    await this.createDocument<PostIndex>(doc, this.POSTS_INDEX);
  }

  private async updateDocument<T extends { id: number }>(
    doc: T,
    index: string
  ) {
    await this.elasticsearchService.update<T>({
      index,
      id: doc.id!.toString(),
      doc,
    });
  }

  async updateAccountDocument(account: Account) {
    const doc: AccountIndex = {
      id: account.id,
      username: account.username,
      name: account.name,
      status: account.status,
      createdAt: account.createdAt,
    };

    await this.updateDocument(doc, this.ACCOUNTS_INDEX);
  }

  async updatePostDocument(post: Post) {
    const doc: PostIndex = {
      id: post.id,
      accountId: post.accountId,
      content: post.content,
      isPrivate: post.account.isPrivate,
      createdAt: post.createdAt,
    };

    await this.updateDocument(doc, this.POSTS_INDEX);
  }

  async deleteDocument(id: number, index: string) {
    await this.elasticsearchService.delete({
      index,
      id: id.toString(),
    });
  }

  async deleteAccountDocument(accountId: number) {
    await this.deleteDocument(accountId, this.ACCOUNTS_INDEX);
  }

  async deletePostDocument(postId: number) {
    await this.deleteDocument(postId, this.POSTS_INDEX);
  }

  async bulkDeleteDocuments(
    ids: number[],
    index: string = this.ACCOUNTS_INDEX
  ) {
    const body = ids.flatMap((id) => [
      { delete: { _index: index, _id: id.toString() } },
    ]);

    await this.elasticsearchService.bulk({ body });
  }

  private decodeCursor(
    cursor: string | undefined
  ): estypes.SortResults | undefined {
    if (!cursor) return undefined;

    let decoded: string;
    try {
      decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    } catch {
      throw new BadRequestException('Invalid cursor format');
    }

    const parsed = JSON.parse(decoded);

    // check if it is an array
    if (!Array.isArray(parsed))
      throw new BadRequestException('Invalid cursor structure');

    return parsed as estypes.SortResults;
  }

  private encodeCursor(sortValues: estypes.SortResults): string {
    return Buffer.from(JSON.stringify(sortValues), 'utf-8').toString('base64');
  }

  private assignNextCursor(
    hits: estypes.SearchHit[],
    limit: number
  ): string | null {
    if (hits.length > limit && hits[limit - 1]?.sort)
      return this.encodeCursor(hits[limit - 1]?.sort!);

    return null;
  }

  private assignAccountSearchParams(
    search_after: estypes.SortResults | undefined,
    q: string,
    limit: number
  ): estypes.SearchRequest {
    // elastic search must queries
    const mustQueries: estypes.QueryDslQueryContainer[] = [
      {
        // search across multiple fields
        multi_match: {
          query: q,
          fields: ['username^2', 'name'], // boost username matches
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
    ];

    const filterQueries: estypes.QueryDslQueryContainer[] = [
      {
        term: {
          status: {
            value: AccountStatus.ACTIVATED,
          },
        },
      },
    ];

    // elastic search params
    const searchParams: estypes.SearchRequest = {
      index: this.ACCOUNTS_INDEX,
      size: limit + 1,
      sort: [{ _score: { order: 'desc' } }, { id: { order: 'desc' } }],
      query: {
        bool: {
          must: mustQueries,
          filter: filterQueries,
        },
      },
      _source: ['id'],
    };

    // if cursor comming from the client ... assign search_after for cursor based pagination
    if (search_after) searchParams.search_after = search_after;

    return searchParams;
  }

  private async searchAccounts(
    search_after: estypes.SortResults | undefined,
    q: string,
    limit: number,
    accountId: number | undefined
  ): Promise<APIResponse> {
    const hits = (
      await this.elasticsearchService.search<AccountIndex>(
        this.assignAccountSearchParams(search_after, q, limit)
      )
    ).hits.hits;

    const nextCursor = this.assignNextCursor(hits, limit);

    const paginatedHits = hits.slice(0, limit);

    // fetch accounts & relationships
    const accountIds = paginatedHits.map((h) => h._source!.id);

    const [accounts, { outgoingMap, incomingMap }] = await Promise.all([
      this.accountsService.findAccountsByIds(accountIds),
      this.accountsService.fetchRelationships(accountId, accountIds),
    ]);

    // match elasticsearch relevance order
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const enhancedAccounts = accountIds.map((id) => {
      const account = accountMap.get(id)!;

      return {
        ...account,
        relationship: {
          outgoing: this.accountsService.getRelationshipType(
            account.id,
            outgoingMap
          ),
          incomingMap: this.accountsService.getRelationshipType(
            account.id,
            incomingMap
          ),
        },
      };
    });

    // update the result
    return {
      size: enhancedAccounts.length,
      data: enhancedAccounts,
      nextCursor,
    };
  }

  private assignPostSearchParams(
    search_after: estypes.SortResults | undefined,
    q: string,
    limit: number,
    accountId: number | undefined,
    blockedAccountIds: number[],
    followingAccountIds: number[],
    live?: boolean
  ) {
    const mustQueries: estypes.QueryDslQueryContainer[] = [
      {
        match: {
          content: {
            query: q,
            fuzziness: 'AUTO',
          },
        },
      },
    ];

    const filterQueries: estypes.QueryDslQueryContainer[] = [];
    const mustNotQueries: estypes.QueryDslQueryContainer[] = [];

    if (!accountId) {
      // if no logged in account, should not display posts with private accounts
      filterQueries.push({
        term: {
          isPrivate: {
            value: false,
          },
        },
      });
    } else {
      // Exclude posts from blocked accounts
      if (blockedAccountIds.length > 0) {
        mustNotQueries.push({
          terms: { accountId: blockedAccountIds },
        });
      }

      const visibleAccountIds = [...followingAccountIds, accountId];
      filterQueries.push({
        // show post if
        bool: {
          // user not private
          should: [
            { term: { isPrivate: { value: false } } },
            {
              bool: {
                must: [
                  { term: { isPrivate: { value: true } } },
                  { terms: { accountId: visibleAccountIds } },
                ],
              },
            },
          ],
          minimum_should_match: 1, // The OR ... at least one condition matches
        },
      });
    }

    const sort: estypes.Sort = [];
    if (live) sort.push({ createdAt: { order: 'desc' } });
    else sort.push({ _score: { order: 'desc' } });

    sort.push({ id: { order: 'desc' } });

    const searchParams: estypes.SearchRequest = {
      index: this.POSTS_INDEX,
      size: limit + 1,
      sort,
      query: {
        bool: {
          must: mustQueries,
          must_not: mustNotQueries,
          filter: filterQueries,
        },
      },
      highlight: {
        fields: {
          content: {
            pre_tags: ['<strong>'],
            post_tags: ['</strong>'],
          },
        },
      },
    };

    if (search_after) searchParams.search_after = search_after;

    return searchParams;
  }

  private async searchPosts(
    search_after: estypes.SortResults | undefined,
    q: string,
    limit: number,
    accountId: number | undefined,
    live?: boolean
  ) {
    // fetch relationships
    const [blockedAccountIds, followingAccountIds] = await Promise.all([
      this.accountsService.getBlockedAccountIds(accountId),
      this.accountsService.getFollowingAccountIds(accountId),
    ]);

    const hits = (
      await this.elasticsearchService.search<PostIndex>(
        this.assignPostSearchParams(
          search_after,
          q,
          limit,
          accountId,
          blockedAccountIds,
          followingAccountIds,
          live
        )
      )
    ).hits.hits;

    const nextCursor = this.assignNextCursor(hits, limit);

    const paginatedHits = hits.slice(0, limit);

    // Now that I have the paginated hits, I need to grap the postFiles
    const postIds = paginatedHits.map((h) => h._source!.id);
    const postFiles = await this.postsService.findPostFiles(postIds);

    const postFilesMap = new Map(postFiles.map((f) => [f.postId, f.files]));

    const postsData = paginatedHits.map((hit) => ({
      ...hit._source,
      highlightedContent: hit.highlight?.content?.[0] || null,
      files: postFilesMap.get(hit._source!.id) || [],
    }));

    return {
      size: postsData.length,
      data: postsData,
      nextCursor,
    };
  }

  async search(
    query: SearchQueryDto,
    accountId: number | undefined
  ): Promise<APIResponse> {
    const { f, q, cursor, limit } = query;

    // decode the given cursor
    const id = this.decodeCursor(cursor);

    switch (f) {
      case SearchFilter.USER:
        // Search in account table to find any matching accounts
        return this.searchAccounts(id, q, limit, accountId);
      case SearchFilter.LIVE:
        // Search through the latest posts
        return this.searchPosts(id, q, limit, accountId, true);
      default:
        // Search through posts ... the best matches gets the higher score
        return this.searchPosts(id, q, limit, accountId);
    }
  }
}
