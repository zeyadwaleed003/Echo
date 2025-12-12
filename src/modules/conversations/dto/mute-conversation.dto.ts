import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MuteConversationDto {
  @ApiPropertyOptional({
    description:
      'Date and time until which the conversation should be muted. If not provided, conversation will be muted indefinitely',
    type: Date,
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDate({
    message: i18nValidationMessage(
      'validation.conversations.muteUntil.IS_DATE'
    ),
  })
  @Type(() => Date)
  muteUntil?: Date;
}
