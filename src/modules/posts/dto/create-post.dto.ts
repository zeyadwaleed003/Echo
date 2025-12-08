import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreatePostDto {
  @IsString({
    message: i18nValidationMessage('validation.post.content.isString'),
  })
  @MaxLength(353, {
    message: i18nValidationMessage('validation.post.content.maxLength'),
  })
  @Transform(({ value }) => value?.trim())
  content: string = '';
}
