import { PickType } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export class TypingDto extends PickType(MessageDto, ['conversationId']) {}
