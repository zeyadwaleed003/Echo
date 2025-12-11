import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ContentType } from '../messages.enum';

export class CreateMessageDto {
  @IsUUID('4', {
    message: 'Conversation ID must be a valid UUID',
  })
  @IsNotEmpty({
    message: 'Conversation ID is required',
  })
  conversationId: string;

  @IsString({
    message: 'Message content must be a string',
  })
  @IsNotEmpty({
    message: 'Message content is required',
  })
  content: string;

  @IsEnum(ContentType, {
    message:
      'Invalid message type. Must be one of: text, image, video, audio, document, location, contact, sticker',
  })
  @IsOptional()
  type?: ContentType = ContentType.TEXT;

  @IsObject({
    message: 'Metadata must be a valid object',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID('4', {
    message: 'Reply message ID must be a valid UUID',
  })
  @IsOptional()
  replyToMessageId?: string;

  @IsString({
    message: 'Temporary ID must be a string',
  })
  @IsOptional()
  tempId?: string; // This is for the client to use

  @IsBoolean({
    message: 'isForwarded must be a boolean',
  })
  @IsOptional()
  isForwarded?: boolean;
}
