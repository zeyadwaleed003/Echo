import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { APIResponse } from 'src/common/types/api.types';
import { SearchFilter } from './search.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { In, Repository } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { estypes } from '@elastic/elasticsearch';
import { AccountDocument } from './search.types';
import { AccountStatus, RelationshipType } from '../accounts/accounts.enums';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly POSTS_INDEX = 'posts';
  private readonly ACCOUNTS_INDEX = 'accounts';

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(AccountRelationships)
    private readonly accountRelationshipsRepository: Repository<AccountRelationships>,
    // @InjectRepository(Post)
    // private readonly postRepository: Repository<Post>,
    // @InjectRepository(PostFiles)
    // private readonly postFilesRepository: Repository<PostFiles>,
    private readonly elasticsearchService: ElasticsearchService
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
            id: { type: 'integer' },
            content: { type: 'text', analyzer: 'standard' },
            createdAt: { type: 'date' },
          },
        },
      });
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

  private assignSearchParams(
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
      {
        // show only activated accounts
        term: { status: AccountStatus.ACTIVATED },
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
        },
      },
    };

    // if cursor comming from the client ... assign search_after for cursor based pagination
    if (search_after) searchParams.search_after = search_after;

    return searchParams;
  }

  private async fetchRelationships(
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

  private getRelationshipType(
    accountId: number | undefined,
    relationshipsMap: Map<number | undefined, RelationshipType>
  ) {
    return relationshipsMap.get(accountId) || null;
  }

  private async searchAccounts(
    search_after: estypes.SortResults | undefined,
    q: string,
    limit: number,
    accountId: number | undefined
  ): Promise<APIResponse> {
    const hits = (
      await this.elasticsearchService.search<AccountDocument>(
        this.assignSearchParams(search_after, q, limit)
      )
    ).hits.hits;

    const nextCursor = this.assignNextCursor(hits, limit);

    const paginatedHits = hits.slice(0, limit);

    // fetch accounts
    const accountIds = paginatedHits.map((h) => h._source!.id);
    const accounts = await this.accountRepository.findBy({
      id: In(accountIds),
    });

    // match elasticsearch relevance order
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const sortedAccounts = accountIds.map((id) => accountMap.get(id));

    // fetch relationships
    const { outgoingMap, incomingMap } = await this.fetchRelationships(
      accountId,
      accountIds
    );

    // enhanced accounts
    const enhancedAccounts = sortedAccounts.map((a) => ({
      ...a,
      relationship: {
        outgoing: this.getRelationshipType(a!.id, outgoingMap),
        incomingMap: this.getRelationshipType(a!.id, incomingMap),
      },
    }));

    // update the result
    return {
      size: enhancedAccounts.length,
      data: enhancedAccounts,
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
      // case SearchFilter.LIVE:
      //   // Search through the latest posts
      //   return this.searchLatestPosts(id, q, limit);
    }

    return {};
  }

  // private async searchLatestPosts(
  //   id: number | undefined,
  //   q: string,
  //   limit: number
  // ) {
  //   // Need to add text highlighting as well pre_tags: ['<strong>'], post_tags: ['</strong>']
  // }
}
