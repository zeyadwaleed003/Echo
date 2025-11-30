import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateBlockedWordDto {
  @ApiProperty({
    description: 'The word to be blocked',
    example: 'spam',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({
    message: i18nValidationMessage('validation.blockedWord.word.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.blockedWord.word.isNotEmpty'),
  })
  @Length(3, 100, {
    message: i18nValidationMessage('validation.blockedWord.word.length'),
  })
  word: string;
}
