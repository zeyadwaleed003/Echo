import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateBlockedWordDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100, { message: 'word must be between 3 and 100 characters' })
  word!: string;
}
