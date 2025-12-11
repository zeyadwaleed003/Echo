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
import { MessageDto } from './dto/message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { RedisService } from '../redis/redis.service';
import { TokenService } from '../token/token.service';
import { EditMessageDto } from './dto/edit-message.dto';
import { AckResponse } from 'src/common/types/api.types';
import { MessageReactDto } from './dto/message-react.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { EVENTS } from 'src/common/events/websocket.events';
import { Account } from '../accounts/entities/account.entity';
import { ConversationIdDto } from './dto/conversation-id.dto';
import { BaseGateway } from 'src/common/gateways/base.gateway';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) })
)
export class MessagesGateway extends BaseGateway {
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger('MessageGateway');

  constructor(
    redisService: RedisService,
    tokenService: TokenService,
    private readonly messagesService: MessagesService,
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

  @SubscribeMessage(EVENTS.MESSAGE_SEND)
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto
  ): Promise<AckResponse> {
    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_DELIVER)
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
        error: error.message || 'Failed to deliver the message',
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
        error: error.message || 'Failed to read the message',
      };
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_REACT)
  async handleMessageReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageReactDto
  ) {
    try {
      const { data } = await this.messagesService.react(
        payload,
        client.account!.id
      );

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(EVENTS.MESSAGE_REACTED, data);

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to react to the message',
      };
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_REACT_DELETE)
  async handleMessageReactDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageDto
  ) {
    try {
      await this.messagesService.deleteReact(payload, client.account!.id);

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(EVENTS.MESSAGE_REACT_DELETED);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete the react from the message',
      };
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_EDIT)
  async handleMessageEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: EditMessageDto
  ): Promise<AckResponse> {
    try {
      const { data } = await this.messagesService.edit(
        payload,
        client.account!.id
      );

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(EVENTS.MESSAGE_EDITED, data);

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to edit the message',
      };
    }
  }

  @SubscribeMessage(EVENTS.TYPING_START)
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationIdDto
  ) {
    client
      .to(`conversation:${payload.conversationId}`)
      .emit(EVENTS.TYPING_START, {
        accountId: client.account!.id,
        conversationId: payload.conversationId,
      });
  }

  @SubscribeMessage(EVENTS.TYPING_STOP)
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ConversationIdDto
  ) {
    client
      .to(`conversation:${payload.conversationId}`)
      .emit(EVENTS.TYPING_STOP, {
        accountId: client.account!.id,
        conversationId: payload.conversationId,
      });
  }

  @SubscribeMessage(EVENTS.MESSAGE_DELETE_FOR_ME)
  async handleDeleteForMe(
    @ConnectedSocket() client: Socket,
    payload: MessageDto
  ) {
    try {
      await this.messagesService.deleteForMe(payload, client.account!.id);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete the message',
      };
    }
  }
}
