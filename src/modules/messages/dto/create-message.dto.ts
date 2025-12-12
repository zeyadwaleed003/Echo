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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description:
      'Unique identifier for the conversation to send the message to',
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

  @ApiProperty({
    description: 'Content of the message',
    type: String,
    example: 'Hello, this is a test message!',
  })
  @IsString({
    message: 'Message content must be a string',
  })
  @IsNotEmpty({
    message: 'Message content is required',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Type of message content',
    enum: ContentType,
    default: ContentType.TEXT,
    example: ContentType.TEXT,
  })
  @IsEnum(ContentType, {
    message:
      'Invalid message type. Must be one of: text, image, video, audio, document, location, contact, sticker',
  })
  @IsOptional()
  type?: ContentType = ContentType.TEXT;

  @ApiPropertyOptional({
    description:
      'Additional metadata for the message (e.g., file size, dimensions, location coordinates)',
    example: { fileSize: 1024, mimeType: 'image/png' },
  })
  @IsObject({
    message: 'Metadata must be a valid object',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID of the message being replied to',
    type: String,
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsUUID('4', {
    message: 'Reply message ID must be a valid UUID',
  })
  @IsOptional()
  replyToMessageId?: string;

  @ApiPropertyOptional({
    description: 'Temporary client-side ID for optimistic UI updates',
    type: String,
    example: 'temp-msg-12345',
  })
  @IsString({
    message: 'Temporary ID must be a string',
  })
  @IsOptional()
  tempId?: string;

  @ApiPropertyOptional({
    description:
      'Indicates whether this message was forwarded from another conversation',
    type: Boolean,
    default: false,
    example: false,
  })
  @IsBoolean({
    message: 'isForwarded must be a boolean',
  })
  @IsOptional()
  isForwarded?: boolean;
}
