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

export class CreateConversationDto {
  @IsArray({ message: 'validation.conversations.participants.isArray' })
  @ArrayNotEmpty({
    message: 'validation.conversations.participants.arrayNotEmpty',
  })
  @IsInt({ each: true, message: 'validation.conversations.participants.isInt' })
  participantIds: number[];

  @IsEnum(ConversationType, { message: 'validation.conversations.type.isEnum' })
  @IsOptional()
  type: ConversationType = ConversationType.GROUP;

  @IsString({ message: 'validation.conversations.name.isString' })
  @IsOptional()
  @Length(1, 100, { message: 'validation.conversations.name.length' })
  name: string;

  @IsString({ message: 'validation.conversations.description.isString' })
  @IsOptional()
  @Length(1, 255, { message: 'validation.conversations.description.length' })
  description: string;
}
