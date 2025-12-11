import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MessageDto } from './dto/message.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageStatusType } from './messages.enum';
import { Message } from './entities/message.entity';
import { HttpResponse } from 'src/common/types/api.types';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageStatus } from './entities/message-status.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { MessageReactDto } from './dto/message-react.dto';
import { MessageReaction } from './entities/message-reaction.entity';
import { EditMessageDto } from './dto/edit-message.dto';

@Injectable()
export class MessagesService {
  private readonly i18nNamespace = 'messages.messages';

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageStatus)
    private readonly messageStatusRepository: Repository<MessageStatus>,
    @InjectRepository(MessageReaction)
    private readonly messageReactionRepository: Repository<MessageReaction>,
    private readonly conversationsService: ConversationsService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService
  ) {}

  async create(senderId: number, dto: CreateMessageDto): Promise<HttpResponse> {
    // Need to check if the user is sending the message in a conversation where he belongs to
    await this.conversationsService.checkIfUserInConversation(
      senderId,
      dto.conversationId
    );

    // If he is replying to a message ... need to check if the message exists in the same conversation
    if (dto.replyToMessageId) {
      const replyToExists = await this.messageRepository.existsBy({
        id: dto.replyToMessageId,
        conversationId: dto.conversationId,
      });

      if (!replyToExists) {
        throw new BadRequestException(
          this.i18n.t(`${this.i18nNamespace}.replyDoesNotExist`)
        );
      }
    }

    // Get all conversation participants without the message sender
    const conversationParticipants =
      await this.conversationsService.findActiveConversationParticipantsIds(
        dto.conversationId,
        senderId
      );

    const message = await this.dataSource.transaction(async (manager) => {
      const messageRepo = manager.getRepository(Message);
      const conversationRepo = manager.getRepository(Conversation);
      const messageStatusRepo = manager.getRepository(MessageStatus);

      // Create message
      const { tempId, ...createMessageBody } = dto;

      const message = messageRepo.create({ ...createMessageBody, senderId });
      await messageRepo.save(message);

      // Create bulk rows in message status table and update the last sent message date in conversation entity
      await Promise.all([
        messageStatusRepo.insert([
          ...conversationParticipants.map((p) => ({
            accountId: p.accountId,
            messageId: message.id,
          })),
        ]),
        conversationRepo.update(
          { id: dto.conversationId },
          { lastMessageAt: new Date() }
        ),
      ]);

      return message;
    });

    return {
      data: {
        ...message,
        tempId: dto.tempId,
      },
    };
  }

  async deliver(payload: MessageDto, accountId: number) {
    return this.changeStatus(payload, accountId, MessageStatusType.DELIVERED);
  }

  async read(payload: MessageDto, accountId: number) {
    return this.changeStatus(payload, accountId, MessageStatusType.READ);
  }

  async react(
    payload: MessageReactDto,
    accountId: number
  ): Promise<HttpResponse> {
    const messageStatus = await this.validateBeforeReact(payload, accountId);
    const { messageId, emoji } = payload;

    const isRead = messageStatus.filter(
      (message) => message.status === MessageStatusType.READ
    );
    if (!isRead.length)
      throw new BadRequestException('Cannot react to an unread message');

    const react = await this.messageReactionRepository.existsBy({
      accountId,
      messageId,
    });
    const data = react
      ? await this.messageReactionRepository.update(
          { accountId, messageId },
          { emoji }
        )
      : await this.messageReactionRepository.save(
          this.messageReactionRepository.create({
            accountId,
            messageId,
            emoji,
          })
        );

    return {
      data: {
        ...data,
        tempId: payload.tempId,
      },
    };
  }

  async deleteReact(payload: MessageDto, accountId: number) {
    await this.validateBeforeReact(payload, accountId);

    const { messageId } = payload;

    const react = await this.messageReactionRepository.findOneBy({
      messageId,
      accountId,
    });
    if (!react)
      throw new BadRequestException('You have not reacted to this message');

    await this.messageReactionRepository.delete({ id: react.id });
  }

  async edit(payload: EditMessageDto, accountId: number) {
    const { conversationId, messageId, content } = payload;

    const [_, message] = await Promise.all([
      this.conversationsService.checkIfUserInConversation(
        accountId,
        conversationId
      ),
      this.messageRepository.findOneBy({ id: messageId }),
    ]);

    if (!message) throw new NotFoundException('No message found with this id');

    if (message.conversationId !== conversationId)
      throw new BadRequestException(
        'This message does not belong to this conversation'
      );

    if (message.senderId !== accountId || message.isForwarded)
      throw new ForbiddenException(
        'You do not have the permission to edit this message'
      );

    await this.messageRepository.update({ id: messageId }, { content });

    message.content = content;

    return { data: message };
  }

  // <----- Helpers ----->

  private async changeStatus(
    payload: MessageDto,
    accountId: number,
    status: MessageStatusType
  ): Promise<HttpResponse> {
    const { conversationId, messageId } = payload;

    const [_, message, messageStatus] = await Promise.all([
      this.conversationsService.checkIfUserInConversation(
        accountId,
        conversationId
      ),
      this.messageRepository.findOneBy({ id: messageId }),
      this.messageStatusRepository.findBy({
        messageId,
        accountId,
      }),
    ]);

    if (!message) throw new NotFoundException('No message found with this id');

    if (message.senderId === accountId)
      throw new BadRequestException(
        'Message cannot be delivered to/read by its sender'
      );

    if (message.conversationId !== conversationId)
      throw new BadRequestException(
        'This message does not belong to this conversation'
      );

    this.validateStatusChange(messageStatus, status);

    const newStatus = this.messageStatusRepository.create({
      messageId: message.id,
      accountId,
      status,
    });
    await this.messageStatusRepository.save(newStatus);

    return {
      data: { ...newStatus, tempId: payload.tempId },
    };
  }

  private validateStatusChange(
    messageStatus: MessageStatus[],
    status: MessageStatusType
  ) {
    const st = messageStatus.map((message) => message.status);
    if (!st.length)
      throw new BadRequestException('No message found with this id.');

    if (!st.includes(MessageStatusType.SENT))
      throw new BadRequestException('This message was not sent');

    if (status === MessageStatusType.DELIVERED) {
      if (
        st.includes(MessageStatusType.DELIVERED) ||
        st.includes(MessageStatusType.READ)
      )
        throw new BadRequestException('This message is already delivered');
    }

    if (status === MessageStatusType.READ) {
      if (!st.includes(MessageStatusType.DELIVERED))
        throw new BadRequestException('This message was not delivered');

      if (st.includes(MessageStatusType.READ))
        throw new BadRequestException('This message is already read');
    }
  }

  private async validateBeforeReact<T extends MessageDto>(
    payload: T,
    accountId: number
  ) {
    const { conversationId, messageId } = payload;

    const [_, message, messageStatus] = await Promise.all([
      this.conversationsService.checkIfUserInConversation(
        accountId,
        conversationId
      ),
      this.messageRepository.findOneBy({ id: messageId }),
      this.messageStatusRepository.findBy({
        messageId,
        accountId,
      }),
    ]);

    if (!message) throw new NotFoundException('No message found with this id');

    if (message.conversationId !== conversationId)
      throw new BadRequestException(
        'This message does not belong to this conversation'
      );

    return messageStatus;
  }
}
