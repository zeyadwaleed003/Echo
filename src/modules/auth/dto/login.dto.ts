import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @ApiProperty({
    description: 'User email address or username used for login',
    example: 'user@example.com',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.emailOrUsername.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.auth.emailOrUsername.isNotEmpty'
    ),
  })
  emailOrUsername!: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.password.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.password.isNotEmpty'),
  })
  password!: string;
}
