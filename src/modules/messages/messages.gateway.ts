import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { CreateMessageDto } from './dto/create-message.dto';
import { EVENTS } from './messages.events';
import { AckResponse } from 'src/common/types/api.types';
import { AuthGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) })
)
@UseGuards(AuthGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server = Server;

  private readonly logger = new Logger('MessageGateway');

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
