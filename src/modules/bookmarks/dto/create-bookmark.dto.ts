import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({
    description: 'ID of the post to bookmark',
    example: 123,
    type: Number,
  })
  @IsNumber()
  postId: number;
}
