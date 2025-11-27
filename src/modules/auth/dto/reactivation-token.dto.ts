import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ReactivationTokenDto {
  @IsString({
    message: i18nValidationMessage(
      'validation.auth.reactivationToken.isString'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.auth.reactivationToken.isNotEmpty'
    ),
  })
  reactivationToken!: string;
}
