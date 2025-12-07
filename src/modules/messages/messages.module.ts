import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessageStatus } from './entities/message-status.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { TokenModule } from '../token/token.module';
import { AuthModule } from '../auth/auth.module';
import { Account } from '../accounts/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      MessageStatus,
      MessageReaction,
      Account,
      RefreshToken,
    ]),
    AuthModule,
    TokenModule,
    ConversationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
