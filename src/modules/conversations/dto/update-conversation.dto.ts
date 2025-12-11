import { IsOptional, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateConversationDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.conversations.name.isString'),
  })
  @Length(1, 100, {
    message: i18nValidationMessage('validation.conversations.name.length'),
  })
  name?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage(
      'validation.conversations.description.isString'
    ),
  })
  @Length(1, 255, {
    message: i18nValidationMessage(
      'validation.conversations.description.length'
    ),
  })
  description?: string;
}
