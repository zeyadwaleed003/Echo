import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { APIResponse } from 'src/common/types/api.types';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageStatus } from './entities/message-status.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class MessagesService {
  private readonly i18nNamespace = 'messages.messages';

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly conversationsService: ConversationsService,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService
  ) {}

  async create(senderId: number, dto: CreateMessageDto): Promise<APIResponse> {
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

    return { data: message };
  }
}
