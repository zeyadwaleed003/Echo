import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString({ message: 'Content must be a string' })
  @MaxLength(353, { message: 'Content must not exceed 353 characters' })
  @Transform(({ value }) => value?.trim())
  content: string = '';
}
