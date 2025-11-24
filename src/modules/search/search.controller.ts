import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuth } from 'src/common/decorators/optionalAuth.decorator';
import type { Request } from 'express';

@Controller('search')
@UseGuards(AuthGuard)
@OptionalAuth()
export class SearchController {
  constructor(private searchService: SearchService) {}

  // Expected Query: q=searchString&f=user,media,live
  @Get()
  search(@Query() q: SearchQueryDto, @Req() req: Request) {
    return this.searchService.search(q, req.account?.id);
  }
}
