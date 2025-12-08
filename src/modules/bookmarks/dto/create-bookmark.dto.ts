import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateBookmarkDto {
  @ApiProperty({
    description: 'ID of the post to bookmark',
    example: 123,
    type: Number,
  })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.bookmark.postId.isNumber'),
    }
  )
  postId: number;
}
