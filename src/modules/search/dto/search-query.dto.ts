import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SearchFilter } from '../search.enums';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

// search?q=sohhhh
export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string to match against accounts or posts',
    example: 'john doe',
    minLength: 1,
    maxLength: 353,
    required: true,
    type: String,
  })
  @IsString({
    message: i18nValidationMessage('validation.search.q.isString'),
  })
  @MinLength(1, {
    message: i18nValidationMessage('validation.search.q.minLength'),
  })
  @MaxLength(353, {
    message: i18nValidationMessage('validation.search.q.maxLength'),
  })
  @Transform(({ value }) => value.trim())
  q: string;

  @ApiProperty({
    description: `Filter type for search results:
- **user**: Search for user accounts by username or display name (boosted username matches)
- **live**: Search for posts sorted by creation time (most recent first)

If no search filter
- Search for posts by content with relevance scoring (best matches first)
`,
    enum: SearchFilter,
    example: SearchFilter.USER,
    required: false,
  })
  @IsEnum(SearchFilter, {
    message: i18nValidationMessage('validation.search.f.isEnum'),
  })
  @IsOptional()
  f: SearchFilter;

  @ApiProperty({
    description: `Base64-encoded cursor for pagination (obtained from \`nextCursor\` in previous response).

**How to use:**
1. Make initial request without cursor
2. Check \`nextCursor\` in response
3. Pass \`nextCursor\` value as \`cursor\` parameter for next page
4. Repeat until \`nextCursor\` is null (no more results)

**Note:** Cursors are stateless and encode sort values (score + ID) for efficient pagination.`,
    example: 'W3sic2NvcmUiOjAuOTV9LHsiaWQiOjEyM31d',
    required: false,
    type: String,
  })
  @IsString({
    message: i18nValidationMessage('validation.search.cursor.isString'),
  })
  @IsOptional()
  cursor?: string;

  @ApiProperty({
    description: `Maximum number of results to return per page. 
    
Recommended values:
- Mobile: 10-15 for better performance
- Desktop: 20-30 for richer experience
- Default: 20`,
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
    type: Number,
  })
  @IsInt({
    message: i18nValidationMessage('validation.search.limit.isInt'),
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, {
    message: i18nValidationMessage('validation.search.limit.min'),
  })
  @Max(100, {
    message: i18nValidationMessage('validation.search.limit.max'),
  })
  limit: number = 20;
}
