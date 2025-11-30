import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email address associated with the account',
    example: 'user@example.com',
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('validation.auth.email.isEmail'),
    }
  )
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.email.isNotEmpty'),
  })
  email: string;
}
