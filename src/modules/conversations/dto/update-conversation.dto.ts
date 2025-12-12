import { IsOptional, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiPropertyOptional({
    description: 'Updated name for the conversation',
    type: String,
    minLength: 1,
    maxLength: 100,
    example: 'Updated Team Discussion',
  })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.conversations.name.isString'),
  })
  @Length(1, 100, {
    message: i18nValidationMessage('validation.conversations.name.length'),
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description for the conversation',
    type: String,
    minLength: 1,
    maxLength: 255,
    example: 'Updated discussion channel for the development team',
  })
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
