import { PickType } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export class ConversationIdDto extends PickType(MessageDto, [
  'conversationId',
]) {}
