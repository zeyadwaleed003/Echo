import { PickType } from '@nestjs/swagger';
import { MessageDto } from './message.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class EditMessageDto extends PickType(MessageDto, [
  'conversationId',
  'messageId',
]) {
  @IsString({
    message: 'Content must be a string',
  })
  @IsNotEmpty({
    message: 'Content must not be empty',
  })
  content: string;
}
