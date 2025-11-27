import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.name.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.name.isNotEmpty'),
  })
  @MinLength(2, {
    message: i18nValidationMessage('validation.auth.name.minLength'),
  })
  @MaxLength(50, {
    message: i18nValidationMessage('validation.auth.name.maxLength'),
  })
  name!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
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
