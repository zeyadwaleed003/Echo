import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
@UseGuards(AuthGuard)
@OptionalAuth()
@ApiBearerAuth()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @ApiOperation({
    summary: 'Search accounts and posts',
    description: `
      Powerful search endpoint that allows users to search through accounts and posts with various filters.
      
      **Features:**
      - Full-text search with fuzzy matching
      - Cursor-based pagination for efficient data retrieval
      - Filter by account or post content
      - Live search for latest posts sorted by time
      - Privacy-aware results (respects account privacy settings)
      - Relationship-aware (excludes blocked accounts)
      - Highlighted search results in post content
      
      **Search Filters:**
      - \`user\`: Search for user accounts by username or name
      - \`live\`: Search for posts sorted by creation time (latest first)

      If no search filter
      - Search for posts by content (sorted by relevance)
      
      **Authentication:**
      - Optional authentication - works with or without auth token
      - Authenticated users see relationship data and privacy-filtered results
      - Unauthenticated users only see public content
    `,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query string (1-353 characters)',
    example: 'john doe',
  })
  @ApiQuery({
    name: 'f',
    required: false,
    enum: ['user', 'live'],
    description: `
      Search filter type:
      - \`user\`: Search accounts by username/name
      - \`live\`: Search posts by recency

      If no search filter:
      - Search posts by content (relevance-based)
    `,
    example: 'user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page (1-100, default: 20)',
    example: 10,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Pagination cursor from previous response (base64 encoded)',
    example: 'eyJzY29yZSI6MC45NSwiaWQiOjEyM30=',
  })
  @Get()
  search(@Query() q: SearchQueryDto, @Req() req: Request) {
    return this.searchService.search(q, req.account?.id);
  }
}
