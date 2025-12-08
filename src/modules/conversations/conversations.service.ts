import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Account } from '../accounts/entities/account.entity';
import { ConversationType, ParticipantRole } from './conversations.enums';
import { AccountsService } from '../accounts/accounts.service';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';
import { I18nService } from 'nestjs-i18n';
import { HttpResponse } from 'src/common/types/api.types';
import { Role } from '../accounts/accounts.enums';

@Injectable()
export class ConversationsService {
  private readonly maxGroupParticipants = 256;
  private readonly i18nNamespace = 'messages.conversations';

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
  ): Promise<HttpResponse> {
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

    let conversation: Conversation,
      members: Account[] = [];
    try {
      if (avatar) {
        const uploadResult = await this.cloudinaryService.uploadFile(avatar);
        uploadedAvatarUrl = uploadResult.secure_url;
        secure_url = uploadedAvatarUrl;
      }

      conversation = await this.dataSource.transaction(async (manager) => {
        // Validate if the admin can have a conversation with participants ... 2 db queries
        members = [
          admin,
          ...(await this.accountsService.validateConversationParticipants(
            manager,
            admin,
            uniqueParticipants
          )),
        ];

        // If *direct* conversation ... need to check if a direct conversation existed before between the 2 users
        if (dto.type === ConversationType.DIRECT) {
          const existingDirectConversation =
            await this.conversationParticipantRepository
              .createQueryBuilder('cp')
              .innerJoin('cp.conversation', 'c')
              .select('cp.conversationId', 'conversationId')
              .where('c.type = :type', { type: ConversationType.DIRECT })
              .andWhere('cp.accountId IN (:...ids)', {
                ids: [admin.id, uniqueParticipants[0]],
              })
              .groupBy('cp.conversationId')
              .having('COUNT(*) = 2')
              .getRawOne();

          if (existingDirectConversation)
            throw new ConflictException(
              this.i18n.t(`${this.i18nNamespace}.DirectConversationExists`)
            );
        }

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

        return conversation;
      });
    } catch (err) {
      if (uploadedAvatarUrl)
        await this.cloudinaryService.deleteFile(uploadedAvatarUrl);

      throw err;
    }

    return {
      data: {
        ...conversation,
        conversationMembers: {
          size: members.length,
          members: members,
        },
      },
    };
  }

  async findById(account: Account, id: string): Promise<HttpResponse> {
    const conversationParticipants =
      await this.conversationParticipantRepository.find({
        relations: ['account', 'conversation'],
        where: { conversationId: id },
      });

    // check if not available
    if (!conversationParticipants.length)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NoConversationFound`)
      );

    // If the account is not the admin ... then he can't view the conversation info unless he is a member in the conversation
    if (account.role === Role.USER)
      await this.checkIfUserInConversation(account.id, id);

    const { conversation } = conversationParticipants[0]!;
    const members = conversationParticipants.map((c) => c.account);

    // TODO: Need to get the number of unread number & the last sent message

    return {
      data: {
        ...conversation,
        conversationMembers: {
          size: members.length,
          members,
        },
      },
    };
  }

  // --- Helpers --- //

  async checkIfUserInConversation(accountId: number, conversationId: string) {
    const exists = await this.conversationParticipantRepository.existsBy({
      accountId,
      conversationId,
    });

    if (!exists) {
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.NotConversationMember`)
      );
    }
  }

  async findActiveConversationParticipantsIds(
    conversationId: string,
    excludeAccountId?: number
  ) {
    return await this.conversationParticipantRepository.find({
      where: {
        conversationId,
        ...(excludeAccountId && { accountId: Not(excludeAccountId) }),
        leftAt: IsNull(),
      },
      select: ['accountId'],
    });
  }
}
