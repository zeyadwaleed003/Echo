import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Message } from './entities/message.entity';
import { TokenModule } from '../token/token.module';
import { RedisModule } from '../redis/redis.module';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { Account } from '../accounts/entities/account.entity';
import { MessageStatus } from './entities/message-status.entity';
import { MessageReaction } from './entities/message-reaction.entity';
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
    RedisModule,
    TokenModule,
    ConversationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
