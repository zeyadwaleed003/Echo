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

export class CreateConversationDto {
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

  @IsEnum(ConversationType, { message: 'validation.conversations.type.isEnum' })
  @IsOptional()
  type: ConversationType = ConversationType.DIRECT;

  @IsString({ message: 'validation.conversations.name.isString' })
  @IsOptional()
  @Length(1, 100, { message: 'validation.conversations.name.length' })
  name: string;

  @IsString({ message: 'validation.conversations.description.isString' })
  @IsOptional()
  @Length(1, 255, { message: 'validation.conversations.description.length' })
  description: string;
}
