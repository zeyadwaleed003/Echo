import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Message } from "./entities/message.entity";
import { HttpResponse } from "src/common/types/api.types";
import { CreateMessageDto } from "./dto/create-message.dto";
import { MessageStatus } from "./entities/message-status.entity";
import { Conversation } from "../conversations/entities/conversation.entity";
import { ConversationsService } from "../conversations/conversations.service";
import { I18nService } from "nestjs-i18n";
import { MessageDto } from "./dto/message.dto";
import { MessageStatusType } from "./messages.enum";

@Injectable()
export class MessagesService {
  private readonly i18nNamespace = "messages.messages";

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageStatus)
    private readonly messageStatusRepository: Repository<MessageStatus>,
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

  async deliver(payload: MessageDto, accountId: number): Promise<HttpResponse> {
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

    if (!message) throw new NotFoundException("No message found with this id");

    if (message.senderId === accountId)
      throw new BadRequestException(
        "Message cannot be delivered to its sender"
      );

    if (message.conversationId !== conversationId)
      throw new BadRequestException(
        "This message does not belong to this conversation"
      );

    if (!messageStatus.length)
      throw new NotFoundException("No message found with this id");

    const cannotDeliver = messageStatus.filter(
      (message) =>
        message.status === MessageStatusType.READ ||
        message.status === MessageStatusType.DELIVERED
    );
    if (cannotDeliver.length)
      throw new NotFoundException("This message is already delivered");

    const newStatus = this.messageStatusRepository.create({
      messageId: message.id,
      accountId,
      status: MessageStatusType.DELIVERED,
    });
    await this.messageStatusRepository.save(newStatus);

    return {
      data: newStatus,
    };
  }
}
