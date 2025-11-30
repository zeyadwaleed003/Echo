import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';
import { Gender } from 'src/modules/accounts/accounts.enums';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CompleteSetupDto {
  @IsString({
    message: i18nValidationMessage('validation.auth.password.isString'),
  })
  @Length(8, 255, {
    message: i18nValidationMessage('validation.auth.password.length'),
  })
  password: string;

  @IsString({
    message: i18nValidationMessage('validation.auth.confirmPassword.isString'),
  })
  @Match('password', {
    message: i18nValidationMessage('validation.auth.confirmPassword.match'),
  })
  confirmPassword: string;

  @IsDate({
    message: i18nValidationMessage('validation.auth.birthDate.isDate'),
  })
  @Type(() => Date)
  birthDate: Date;

  @IsEnum(Gender, {
    message: i18nValidationMessage('validation.auth.gender.isEnum'),
  })
  gender: Gender;

  @IsString({
    message: i18nValidationMessage('validation.auth.username.isString'),
  })
  @Length(3, 50, {
    message: i18nValidationMessage('validation.auth.username.length'),
  })
  @IsAlphanumeric(undefined, {
    message: i18nValidationMessage('validation.auth.username.isAlphanumeric'),
  })
  username: string;

  @IsString({
    message: i18nValidationMessage('validation.auth.setupToken.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.setupToken.isNotEmpty'),
  })
  setupToken: string;
}
