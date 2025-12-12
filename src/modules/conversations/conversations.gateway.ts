import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { TokenService } from '../token/token.service';
import { AckResponse } from 'src/common/types/api.types';
import { AccountStatus } from '../messages/messages.types';
import { EVENTS } from 'src/common/events/websocket.events';
import { Account } from '../accounts/entities/account.entity';
import { BaseGateway } from 'src/common/gateways/base.gateway';
import { ConversationsService } from './conversations.service';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ConversationIdDto } from '../messages/dto/conversation-id.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) })
)
export class ConversationsGateway extends BaseGateway {
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger('ConversationsGateway');

  constructor(
    redisService: RedisService,
    tokenService: TokenService,
    private readonly conversationsService: ConversationsService,
    @InjectRepository(Account)
    accountsRepository: Repository<Account>,
    @InjectRepository(RefreshToken)
    refreshTokenRepository: Repository<RefreshToken>
  ) {
    super(
      redisService,
      tokenService,
      accountsRepository,
      refreshTokenRepository
    );
  }

  @SubscribeMessage(EVENTS.CONVERSATION_JOIN)
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationIdDto
  ): Promise<AckResponse> {
    try {
      await this.conversationsService.checkIfUserInConversation(
        client.account!.id,
        payload.conversationId
      );

      await client.join(`conversation:${payload.conversationId}`);

      const participantIds =
        await this.conversationsService.findActiveConversationParticipantsIds(
          payload.conversationId
        );

      const statuses = await Promise.all(
        participantIds.map(async (p) => {
          const status = await this.redisService.get<AccountStatus>(
            this.REDIS_KEYS.accountStatus(p)
          );
          return {
            accountId: p,
            ...status,
          };
        })
      );

      return { success: true, data: { statuses } };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to join conversation',
      };
    }
  }

  @SubscribeMessage(EVENTS.CONVERSATION_LEAVE)
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationIdDto
  ): Promise<AckResponse> {
    await client.leave(`conversation:${payload.conversationId}`);
    return { success: true };
  }
}
