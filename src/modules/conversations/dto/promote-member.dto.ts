import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class PromoteMemberDto {
  @ApiProperty({
    description: 'User ID of the member to promote to admin/moderator',
    type: Number,
    example: 7,
    minimum: 1,
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.conversations.memberId.NOT_EMPTY'
    ),
  })
  @IsInt({
    message: i18nValidationMessage('validation.conversations.memberId.IS_INT'),
  })
  @IsPositive({
    message: i18nValidationMessage(
      'validation.conversations.memberId.IS_POSITIVE'
    ),
  })
  @Type(() => Number)
  memberId: number;
}
