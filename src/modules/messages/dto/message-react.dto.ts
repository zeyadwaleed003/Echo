import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { MessageDto } from './message.dto';
import { ApiProperty } from '@nestjs/swagger';

export class MessageReactDto extends MessageDto {
  @ApiProperty({
    description:
      'Emoji reaction to add to the message. Supports standard emoji characters',
    type: String,
    minLength: 1,
    maxLength: 10,
    example: '👍',
    pattern: '^[\\p{Emoji}\\p{Emoji_Component}]+$',
  })
  @IsNotEmpty({
    message: 'Emoji cannot be empty',
  })
  @IsString({
    message: 'Emoji must be a valid string value',
  })
  @Length(1, 10, {
    message: 'Emoji length must be between 1 and 10 characters',
  })
  @Matches(/^[\p{Emoji}\p{Emoji_Component}]+$/u, {
    message: 'Invalid emoji format',
  })
  emoji: string;
}
