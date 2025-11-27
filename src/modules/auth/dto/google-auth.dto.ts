import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GoogleAuthDto {
  @ApiProperty({
    description:
      'Google ID token received from the client after authentication',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU2ZT...',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.idToken.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.idToken.isNotEmpty'),
  })
  idToken!: string;
}
