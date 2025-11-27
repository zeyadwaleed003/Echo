import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

function parseJsonArray(value: any) {
  if (!value) return undefined;

  if (Array.isArray(value)) return value.map(Number);

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)];
    } catch {
      return [Number(value)];
    }
  }
  return [Number(value)];
}

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @IsArray({
    message: i18nValidationMessage('validation.post.deleteFileIds.isArray'),
  })
  @IsInt({
    each: true,
    message: i18nValidationMessage('validation.post.deleteFileIds.isInt'),
  })
  @ArrayMaxSize(4, {
    message: i18nValidationMessage(
      'validation.post.deleteFileIds.arrayMaxSize'
    ),
  })
  deleteFileIds?: number[];
}
