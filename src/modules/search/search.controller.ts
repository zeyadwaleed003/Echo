import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  // Expected Query: // q=searchString&f=user,media,live
  @Get()
  search(@Query() q: SearchQueryDto) {
    return this.searchService.search(q);
  }
}
