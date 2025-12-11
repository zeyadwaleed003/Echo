import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { AccountsModule } from '../accounts/accounts.module';
import { Account } from '../accounts/entities/account.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsGateway } from './conversations.gateway';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      Account,
      RefreshToken,
    ]),
    AuthModule,
    RedisModule,
    TokenModule,
    AccountsModule,
    CloudinaryModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsGateway],
  exports: [ConversationsService],
})
export class ConversationsModule {}
