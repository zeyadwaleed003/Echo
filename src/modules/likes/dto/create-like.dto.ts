import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateLikeDto {
  @ApiProperty({
    type: Number,
    description: 'ID of the post to like',
    example: 123,
  })
  @IsInt({
    message: i18nValidationMessage('validation.like.postId.isInt'),
  })
  @IsPositive({
    message: i18nValidationMessage('validation.like.postId.isPositive'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.like.postId.isNotEmpty'),
  })
  @Type(() => Number)
  postId: number;
}
