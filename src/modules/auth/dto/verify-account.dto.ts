import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerifyOtpDto {
  @ApiProperty({
    description: '6-digit verification code sent to the user',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.verificationCode.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.auth.verificationCode.isNotEmpty'
    ),
  })
  @MinLength(6, {
    message: i18nValidationMessage(
      'validation.auth.verificationCode.minLength'
    ),
  })
  @MaxLength(6, {
    message: i18nValidationMessage(
      'validation.auth.verificationCode.maxLength'
    ),
  })
  verificationCode!: string;

  @ApiProperty({
    description: 'Email address of the user',
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
  email!: string;
}
