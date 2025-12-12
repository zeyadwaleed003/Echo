import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  ArrayNotEmpty,
} from 'class-validator';
import { ConversationType } from '../conversations.enums';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Array of participant user IDs to add to the conversation',
    type: [Number],
    example: [1, 2, 3],
    isArray: true,
  })
  @IsArray({ message: 'validation.conversations.participants.isArray' })
  @ArrayNotEmpty({
    message: 'validation.conversations.participants.arrayNotEmpty',
  })
  @IsInt({ each: true, message: 'validation.conversations.participants.isInt' })
  @Transform(({ value }) => {
    if (typeof value === 'string')
      return value.split(',').map((id) => parseInt(id.trim(), 10));

    if (Array.isArray(value)) return value.map((id) => parseInt(id, 10));
    return value;
  })
  participantIds: number[];

  @ApiPropertyOptional({
    description: 'Type of conversation',
    enum: ConversationType,
    default: ConversationType.DIRECT,
    example: ConversationType.DIRECT,
  })
  @IsEnum(ConversationType, { message: 'validation.conversations.type.isEnum' })
  @IsOptional()
  type: ConversationType = ConversationType.DIRECT;

  @ApiPropertyOptional({
    description: 'Name of the conversation (for group chats)',
    type: String,
    minLength: 1,
    maxLength: 100,
    example: 'Team Discussion',
  })
  @IsString({ message: 'validation.conversations.name.isString' })
  @IsOptional()
  @Length(1, 100, { message: 'validation.conversations.name.length' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the conversation',
    type: String,
    minLength: 1,
    maxLength: 255,
    example: 'Discussion channel for the development team',
  })
  @IsString({ message: 'validation.conversations.description.isString' })
  @IsOptional()
  @Length(1, 255, { message: 'validation.conversations.description.length' })
  description: string;
}
