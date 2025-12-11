import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ContentType } from '../messages.enum';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateMessageDto {
  @IsUUID('4', {
    message: i18nValidationMessage('validation.messages.conversationId.isUuid'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.messages.conversationId.isNotEmpty'
    ),
  })
  conversationId: string;

  @IsString({
    message: i18nValidationMessage('validation.messages.content.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.messages.content.isNotEmpty'),
  })
  content: string;

  @IsEnum(ContentType, {
    message: i18nValidationMessage('validation.messages.type.isEnum'),
  })
  @IsOptional()
  type?: ContentType = ContentType.TEXT;

  @IsObject({
    message: i18nValidationMessage('validation.messages.metadata.isObject'),
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID('4', {
    message: i18nValidationMessage(
      'validation.messages.replyToMessageId.isUuid'
    ),
  })
  @IsOptional()
  replyToMessageId?: string;

  @IsString({
    message: i18nValidationMessage('validation.messages.tempId.isString'),
  })
  @IsOptional()
  tempId?: string; // This is for the client to use

  @IsBoolean({
    message: i18nValidationMessage('validation.messages.isForwarded.isBoolean'),
  })
  @IsOptional()
  isForwarded?: boolean;
}
