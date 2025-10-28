import { PartialType } from '@nestjs/mapped-types';
import { CreateBlockedWordDto } from './create-blocked-word.dto';

export class UpdateBlockedWordDto extends PartialType(CreateBlockedWordDto) {}
