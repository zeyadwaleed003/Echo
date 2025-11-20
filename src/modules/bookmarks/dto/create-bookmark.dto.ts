import { IsNumber } from 'class-validator';

export class CreateBookmarkDto {
  @IsNumber()
  postId: number;
}
