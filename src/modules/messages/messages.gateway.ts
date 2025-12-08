import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EVENTS } from './messages.events';
import { AccountStatus } from './messages.types';
import { MessagesService } from './messages.service';
import { RedisService } from '../redis/redis.service';
import { AckResponse } from 'src/common/types/api.types';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) })
)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server = Server;

  private readonly logger = new Logger('MessageGateway');
  private readonly REDIS_KEYS = {
    accountStatus: (accountId: number) => `account:${accountId}`,
    accountSockets: (accountId: number) => `account:${accountId}:sockets`,
  };

  constructor(
    private readonly messagesService: MessagesService,
    private readonly redisService: RedisService
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const accountId = client.account!.id;
    await this.redisService.set<AccountStatus>(
      this.REDIS_KEYS.accountStatus(accountId),
      {
        online: true,
        lastSeen: Date.now(),
      }
    );

    await this.redisService.sadd(
      this.REDIS_KEYS.accountSockets(accountId),
      client.id
    );
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const accountId = client.account!.id;
    await this.redisService.srem(
      this.REDIS_KEYS.accountSockets(accountId),
      client.id
    );

    const socketsLeft = await this.redisService.scard(
      this.REDIS_KEYS.accountSockets(accountId)
    );
    if (!socketsLeft) {
      await this.redisService.set<AccountStatus>(
        this.REDIS_KEYS.accountStatus(accountId),
        {
          online: false,
          lastSeen: Date.now(),
        }
      );
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_SEND)
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto
  ): Promise<AckResponse> {
    this.logger.log(`Client: ${client.id} is sending a message`);

    // Create the message
    const { data } = await this.messagesService.create(
      client.account!.id,
      payload
    );

    client
      .to(`conversation:${payload.conversationId}`)
      .emit(EVENTS.MESSAGE_SENT, data);

    return { success: true, data: 'data' };
  }
}
