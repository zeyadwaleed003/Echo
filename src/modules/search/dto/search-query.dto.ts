import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SearchFilter } from '../search.enums';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'john',
  })
  @IsString()
  @MaxLength(353)
  @Transform(({ value }) => value.trim())
  q: string;

  @ApiProperty({
    description: 'Filter search results',
    enum: SearchFilter,
    required: false,
  })
  @IsEnum(SearchFilter)
  f: SearchFilter;

  @ApiProperty({
    description: 'Cursor for pagination',
    required: false,
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({
    description: 'Number of results to return',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number = 20;
}
