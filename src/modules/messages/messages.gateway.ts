import { Logger, UsePipes, ValidationPipe } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Repository } from "typeorm";
import { Server, Socket } from "socket.io";
import { EVENTS } from "./messages.events";
import { AccountStatus } from "./messages.types";
import { InjectRepository } from "@nestjs/typeorm";
import { MessagesService } from "./messages.service";
import { RedisService } from "../redis/redis.service";
import { TokenService } from "../token/token.service";
import { AckResponse } from "src/common/types/api.types";
import { CreateMessageDto } from "./dto/create-message.dto";
import { Account } from "../accounts/entities/account.entity";
import { WsAuthHelper } from "src/common/helpers/ws-auth.helper";
import { RefreshToken } from "../auth/entities/refresh-token.entity";
import { MessageDto } from "./dto/message.dto";

@WebSocketGateway({
  cors: {
    origin: "*",
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

  private readonly wsAuthHelper: WsAuthHelper;
  private readonly logger = new Logger("MessageGateway");
  private readonly REDIS_KEYS = {
    accountStatus: (accountId: number) => `account:${accountId}`,
    accountSockets: (accountId: number) => `account:${accountId}:sockets`,
  };

  constructor(
    private readonly redisService: RedisService,
    tokenService: TokenService,
    private readonly messagesService: MessagesService,
    @InjectRepository(Account)
    accountsRepository: Repository<Account>,
    @InjectRepository(RefreshToken)
    refreshTokenRepository: Repository<RefreshToken>
  ) {
    this.wsAuthHelper = new WsAuthHelper(
      tokenService,
      accountsRepository,
      refreshTokenRepository
    );
  }

  private async handleAuth(client: Socket) {
    // Authorize
    const isAuth = await this.wsAuthHelper.authenticate(client);

    // If authentication fails
    if (!isAuth.success) {
      this.logger.warn(
        `Client connection rejected: ${client.id}, reason: ${isAuth.reason}`
      );

      client.emit("error", { reason: isAuth.reason });
      return;
    }
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    await this.handleAuth(client);

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

    if (client.account) {
      const accountId = client.account.id;

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

    return { success: true, data };
  }

  @SubscribeMessage(EVENTS.MESSAGE_DELIVERED)
  async handleMessageDelivery(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageDto
  ): Promise<AckResponse> {
    // Deliver the message
    try {
      const { data } = await this.messagesService.deliver(
        payload,
        client.account!.id
      );

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(EVENTS.MESSAGE_DELIVERED, data);

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to deliver the message",
      };
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_READ)
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageDto
  ): Promise<AckResponse> {
    // Read the message
    try {
      const { data } = await this.messagesService.read(
        payload,
        client.account!.id
      );

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(EVENTS.MESSAGE_READ, data);

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to read the message",
      };
    }
  }
}
