import { PickType } from '@nestjs/swagger';
import { MessageDto } from './message.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditMessageDto extends PickType(MessageDto, [
  'conversationId',
  'messageId',
]) {
  @ApiProperty({
    description: 'Updated content for the message',
    type: String,
    example: 'This is the edited message content',
  })
  @IsString({
    message: 'Content must be a string',
  })
  @IsNotEmpty({
    message: 'Content must not be empty',
  })
  content: string;
}
