import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Account } from '../accounts/entities/account.entity';
import { ConversationType, ParticipantRole } from './conversations.enums';
import { AccountsService } from '../accounts/accounts.service';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ConversationsService {
  private readonly i18nNamespace = 'messages.conversations';
  private readonly maxGroupParticipants = 256;

  constructor(
    private readonly accountsService: AccountsService,
    private readonly dataSource: DataSource,
    @InjectRepository(ConversationParticipant)
    private readonly conversationParticipantRepository: Repository<ConversationParticipant>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly i18n: I18nService
  ) {}

  async create(
    admin: Account,
    dto: CreateConversationDto,
    avatar: Express.Multer.File
  ) {
    // Admin is already valid because he is logged in

    // Remove duplicates and remove the admin id if he was in the participant ids
    const uniqueParticipants = [...new Set(dto.participantIds)].filter(
      (id) => id !== admin.id
    );
    const participantsNumber = uniqueParticipants.length;

    // If no participants in the array after filteration ... throw error
    if (!participantsNumber)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NoValidParticipants`)
      );

    // A group conversation can't have more than 256 members (255 participant + admin)
    if (participantsNumber > this.maxGroupParticipants - 1)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.TooManyParticipants`, {
          args: { max: this.maxGroupParticipants },
        })
      );

    // If more than one participant ... the conversation must be a *Group* conversation
    if (participantsNumber > 1) dto.type = ConversationType.GROUP;

    // A group chat must have a name
    if (dto.type === ConversationType.GROUP && !dto.name)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.GroupNameRequired`)
      );

    let secure_url = this.configService.get<string>(
      'DEFAULT_CONVERSATION_AVATAR_URL',
      ''
    );
    let uploadedAvatarUrl: string | null = null;

    try {
      if (avatar) {
        const uploadResult = await this.cloudinaryService.uploadFile(avatar);
        uploadedAvatarUrl = uploadResult.secure_url;
        secure_url = uploadedAvatarUrl;
      }

      await this.dataSource.transaction(async (manager) => {
        // Validate if the admin can have a conversation with participants ... 2 db queries
        await this.accountsService.validateConversationParticipants(
          manager,
          admin,
          dto.participantIds
        );

        // If *direct* conversation ... need to check if one existed before between the 2 users
        const existingDirectConversation =
          await this.conversationParticipantRepository
            .createQueryBuilder('cp')
            .innerJoin('cp.conversation', 'c')
            .where('c.type = :type', { type: ConversationType.DIRECT })
            .andWhere('cp.accountId IN (:...ids)', {
              ids: [admin.id, uniqueParticipants[0]],
            })
            .groupBy('cp.conversationId')
            .having('COUNT(cp.conversationId) = 2')
            .getOne();

        if (existingDirectConversation)
          throw new ConflictException(
            this.i18n.t(`${this.i18nNamespace}.DirectConversationExists`)
          );

        // Create the conversation
        const conversationRepo = manager.getRepository(Conversation);
        const conversationParticipantRepo = manager.getRepository(
          ConversationParticipant
        );

        const conversation = conversationRepo.create({
          ...dto,
          avatar: secure_url,
          createdById: admin.id,
        });
        await conversationRepo.save(conversation);

        await conversationParticipantRepo.insert([
          ...uniqueParticipants.map((p) => ({
            accountId: p,
            conversationId: conversation.id,
          })),
          {
            accountId: admin.id,
            conversationId: conversation.id,
            role: ParticipantRole.ADMIN,
          },
        ]);
      });
    } catch (err) {
      if (uploadedAvatarUrl)
        await this.cloudinaryService.deleteFile(uploadedAvatarUrl);

      throw err;
    }
  }
}
