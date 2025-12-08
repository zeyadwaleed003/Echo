import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ManageMembersDto {
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
