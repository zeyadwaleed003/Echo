import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlockedWordDto {
  @ApiProperty({
    description: 'The word to be blocked',
    example: 'spam',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100, { message: 'word must be between 3 and 100 characters' })
  word!: string;
}
