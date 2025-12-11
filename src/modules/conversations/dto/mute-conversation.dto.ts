import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class MuteConversationDto {
  @IsOptional()
  @IsDate({
    message: i18nValidationMessage(
      'validation.conversations.muteUntil.IS_DATE'
    ),
  })
  @Type(() => Date)
  muteUntil?: Date;
}
