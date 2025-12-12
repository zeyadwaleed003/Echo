import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class ManageMembersDto {
  @ApiProperty({
    description:
      'Array of member user IDs to add or remove from the conversation',
    type: [Number],
    example: [4, 5, 6],
    isArray: true,
    minimum: 1,
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.conversations.memberIds.NOT_EMPTY'
    ),
  })
  @IsArray({
    message: i18nValidationMessage(
      'validation.conversations.memberIds.IS_ARRAY'
    ),
  })
  @ArrayMinSize(1, {
    message: i18nValidationMessage(
      'validation.conversations.memberIds.ARRAY_MIN_SIZE'
    ),
  })
  @ArrayUnique({
    message: i18nValidationMessage(
      'validation.conversations.memberIds.ARRAY_UNIQUE'
    ),
  })
  @IsInt({
    each: true,
    message: i18nValidationMessage('validation.conversations.memberIds.IS_INT'),
  })
  @IsPositive({
    each: true,
    message: i18nValidationMessage(
      'validation.conversations.memberIds.IS_POSITIVE'
    ),
  })
  memberIds: number[];
}
