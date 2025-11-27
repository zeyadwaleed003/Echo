import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token sent to the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.token.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.token.isNotEmpty'),
  })
  token!: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'newStrongPassword123',
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
  password!: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'newStrongPassword123',
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
  confirmPassword!: string;
}
