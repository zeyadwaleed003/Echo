import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The current password of the user',
    example: 'OldPassword123!',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.oldPassword.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.oldPassword.isNotEmpty'),
  })
  oldPassword: string;

  @ApiProperty({
    description: 'The new password',
    example: 'NewPassword456!',
    minLength: 8,
    maxLength: 255,
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.password.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.password.isNotEmpty'),
  })
  @MinLength(8, {
    message: i18nValidationMessage('validation.auth.password.minLength'),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.auth.password.maxLength'),
  })
  password: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'NewPassword456!',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.confirmPassword.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.auth.confirmPassword.isNotEmpty'
    ),
  })
  @Match('password', {
    message: i18nValidationMessage('validation.auth.confirmPassword.match'),
  })
  confirmPassword: string;
}
