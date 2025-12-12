import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';
import { ApiProperty } from '@nestjs/swagger';

export class MessageDto extends PickType(CreateMessageDto, ['tempId']) {
  @ApiProperty({
    description: 'Unique identifier for the message',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', {
    message: 'Message ID must be a valid UUID',
  })
  @IsNotEmpty({
    message: 'Message ID is required',
  })
  messageId: string;

  @ApiProperty({
    description: 'Unique identifier for the conversation',
    type: String,
    format: 'uuid',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @IsUUID('4', {
    message: 'Conversation ID must be a valid UUID',
  })
  @IsNotEmpty({
    message: 'Conversation ID is required',
  })
  conversationId: string;
}
