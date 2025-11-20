import { BadRequestException, Injectable } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto';
import { APIResponse } from 'src/common/types/api.types';
import { SearchFilter } from './search.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { ILike, LessThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>
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

    let nextCursor: string | null = null;
    if (accounts.length > limit)
      nextCursor = this.encodeCursor(accounts[accounts.length - 1]!.id);

    const paginatedAccounts = accounts.slice(0, limit);

    return {
      size: paginatedAccounts.length,
      data: paginatedAccounts,
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
    }

    return {};
  }
}
