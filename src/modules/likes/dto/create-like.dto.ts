import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({
    type: Number,
    description: 'ID of the post to like',
    example: 123,
  })
  @IsInt({ message: 'PostId must be an integer' })
  @IsPositive({ message: 'PostId must be a positive number' })
  @IsNotEmpty({ message: 'PostId is required' })
  @Type(() => Number)
  postId: number;
}
