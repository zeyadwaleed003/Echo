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
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';
import { I18nService } from 'nestjs-i18n';
import { HttpResponse } from 'src/common/types/api.types';
import { Role } from '../accounts/accounts.enums';
import { ManageMembersDto } from './dto/manage-members.dto';
import { PromoteMemberDto } from './dto/promote-member.dto';
import { MuteConversationDto } from './dto/mute-conversation.dto';

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
        conversation,
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

  async addMembersToGroup(
    account: Account,
    conversationId: string,
    dto: ManageMembersDto
  ) {
    // Filter the admin if in the members array
    const members = dto.memberIds.filter((id) => id !== account.id);
    if (!members.length)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NoValidMembersToAdd`)
      );

    const [accountParticipant, oldMembers] = await Promise.all([
      this.conversationParticipantRepository.findOne({
        where: { conversationId, accountId: account.id },
        relations: ['conversation'],
      }),
      this.conversationParticipantRepository.find({
        where: { conversationId },
        select: ['accountId', 'leftAt'],
      }),
    ]);

    // Check if valid conversation
    this.validateConversationForManagingMembers(accountParticipant);

    // I want to only add the unique members that are not previously in the group
    const oldMembersMap = new Map(
      oldMembers.map((p) => [p.accountId, p.leftAt])
    );

    const newMemberIds: number[] = []; // This is the ids of the new members
    const returningMemberIds: number[] = []; // The ids of members were in the group and left it and wants to join again
    const alreadyActiveMemberIds: number[] = []; // Ids of members already in the group

    for (const memberId of members) {
      if (!oldMembersMap.has(memberId)) newMemberIds.push(memberId);
      else {
        const leftAt = oldMembersMap.get(memberId);

        leftAt === null
          ? alreadyActiveMemberIds.push(memberId)
          : returningMemberIds.push(memberId);
      }
    }

    // No new members and no old members returning to the group
    if (!newMemberIds.length && !returningMemberIds.length)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.MembersAlreadyInGroup`)
      );

    const currentActiveMembersCount = oldMembers.filter(
      (p) => p.leftAt === null
    ).length;

    // The group can't contain more than 256 member
    const newTotalActiveMembersNumber =
      newMemberIds.length +
      returningMemberIds.length +
      currentActiveMembersCount;

    if (newTotalActiveMembersNumber > this.maxGroupParticipants)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.ExceedsMaxParticipants`, {
          args: {
            max: this.maxGroupParticipants,
            current: currentActiveMembersCount,
            adding: newMemberIds.length + returningMemberIds.length,
          },
        })
      );

    await this.dataSource.transaction(async (manager) => {
      if (newMemberIds.length > 0) {
        // Validate new members
        await this.accountsService.validateConversationParticipants(
          manager,
          account,
          newMemberIds
        );
      }

      const conversationParticipantRepo = manager.getRepository(
        ConversationParticipant
      );

      if (newMemberIds.length)
        await conversationParticipantRepo.insert(
          newMemberIds.map((m) => ({
            conversationId,
            accountId: m,
          }))
        );

      if (returningMemberIds.length)
        await conversationParticipantRepo.update(
          { conversationId, accountId: In(returningMemberIds) },
          {
            leftAt: null,
            joinedAt: new Date(),
          }
        );
    });

    return {
      data: {
        conversationId,
        addedMembers: newMemberIds.length,
        returningMembers: returningMemberIds.length,
        totalActiveMembers: newTotalActiveMembersNumber,
        alreadyActive: alreadyActiveMemberIds.length,
      },
    };
  }

  async removeMembersFromGroup(
    account: Account,
    conversationId: string,
    dto: ManageMembersDto
  ): Promise<HttpResponse> {
    const members = dto.memberIds.filter((id) => id !== account.id);
    if (!members.length)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NoValidMembersToRemove`)
      );

    const accountParticipant =
      await this.conversationParticipantRepository.findOne({
        where: { conversationId, accountId: account.id },
        relations: ['conversation'],
      });

    this.validateConversationForManagingMembers(accountParticipant);

    await this.conversationParticipantRepository.update(
      {
        conversationId,
        accountId: In(members),
      },
      {
        leftAt: new Date(),
      }
    );

    return {
      message: this.i18n.t(`${this.i18nNamespace}.RemovedFromConversation`),
    };
  }

  async leaveGroup(
    account: Account,
    conversationId: string
  ): Promise<HttpResponse> {
    const accountParticipant =
      await this.conversationParticipantRepository.findOne({
        where: { conversationId, accountId: account.id, leftAt: IsNull() },
        relations: ['conversation'],
      });

    // Validate participant and conversation existance
    if (!accountParticipant || !accountParticipant.conversation)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NotConversationMember`)
      );

    if (accountParticipant.conversation.type !== ConversationType.GROUP)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.CanOnlyLeaveGroupConversations`)
      );

    const isAdmin = accountParticipant.role === ParticipantRole.ADMIN;

    // Handle admin leaving with other members present
    await this.dataSource.transaction(async (manager) => {
      const conversationParticipantRepo = manager.getRepository(
        ConversationParticipant
      );

      // If the user was leaving the group was the admin and there was no other admin in the group ... need to promot a new member to be an admin
      const adminExists = await conversationParticipantRepo.existsBy({
        conversationId,
        accountId: Not(account.id),
        leftAt: IsNull(),
        role: ParticipantRole.ADMIN,
      });

      if (isAdmin && !adminExists) {
        const oldestMember = await conversationParticipantRepo.findOne({
          where: {
            conversationId,
            accountId: Not(account.id),
            leftAt: IsNull(),
          },
          order: { joinedAt: 'ASC' },
          select: ['accountId'],
        });

        if (!oldestMember)
          throw new BadRequestException(
            this.i18n.t(`${this.i18nNamespace}.NoMembersToPromote`)
          );

        // Promote new admin
        await conversationParticipantRepo.update(
          { conversationId, accountId: oldestMember.accountId },
          { role: ParticipantRole.ADMIN }
        );
      }

      // Mark account as left
      await conversationParticipantRepo.update(
        { conversationId, accountId: account.id },
        { leftAt: new Date() }
      );
    });

    return {
      message: this.i18n.t(`${this.i18nNamespace}.LeftGroup`),
    };
  }

  async promoteMemberToAdmin(
    account: Account,
    conversationId: string,
    dto: PromoteMemberDto
  ): Promise<HttpResponse> {
    if (dto.memberId === account.id) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.CannotPromoteYourself`)
      );
    }

    const [accountParticipant, memberToPromote] = await Promise.all([
      this.conversationParticipantRepository.findOne({
        where: { conversationId, accountId: account.id },
        relations: ['conversation'],
      }),
      this.conversationParticipantRepository.findOne({
        where: {
          conversationId,
          accountId: dto.memberId,
          leftAt: IsNull(),
        },
      }),
    ]);

    // The account should be an admin in a group conversation
    this.validateConversationForManagingMembers(accountParticipant);

    // Check member existance
    if (!memberToPromote) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.MemberNotInGroup`)
      );
    }

    // Check if already an admin
    if (memberToPromote.role === ParticipantRole.ADMIN) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.MemberAlreadyAdmin`)
      );
    }

    // Promote the member
    await this.conversationParticipantRepository.update(
      { conversationId, accountId: dto.memberId },
      { role: ParticipantRole.ADMIN }
    );

    return {
      message: this.i18n.t(`${this.i18nNamespace}.MemberPromotedSuccessfully`),
    };
  }

  async togglePin(
    account: Account,
    conversationId: string
  ): Promise<HttpResponse> {
    return this.toggleConversationProperty(
      account,
      conversationId,
      'isPinned',
      'ConversationPinned',
      'ConversationUnpinned'
    );
  }

  async toggleArchive(
    account: Account,
    conversationId: string
  ): Promise<HttpResponse> {
    return this.toggleConversationProperty(
      account,
      conversationId,
      'isArchived',
      'ConversationArchived',
      'ConversationUnarchived'
    );
  }

  async muteConversation(
    account: Account,
    conversationId: string,
    dto: MuteConversationDto
  ): Promise<HttpResponse> {
    const participant = await this.conversationParticipantRepository.findOne({
      where: {
        conversationId,
        accountId: account.id,
        leftAt: IsNull(),
      },
    });

    if (!participant) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NotConversationMember`)
      );
    }

    if (participant.isMuted) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.ConversationAlreadyMuted`)
      );
    }

    // Validate muteUntil is in the future if provided
    if (dto.muteUntil && dto.muteUntil <= new Date()) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.MuteUntilMustBeFuture`)
      );
    }

    await this.conversationParticipantRepository.update(
      { conversationId, accountId: account.id },
      {
        isMuted: true,
        mutedUntil: dto.muteUntil || null,
      }
    );

    return {
      message: this.i18n.t(`${this.i18nNamespace}.ConversationMuted`),
      data: {
        isMuted: true,
        mutedUntil: dto.muteUntil || null,
      },
    };
  }

  async unmuteConversation(
    account: Account,
    conversationId: string
  ): Promise<HttpResponse> {
    const participant = await this.conversationParticipantRepository.findOne({
      where: {
        conversationId,
        accountId: account.id,
        leftAt: IsNull(),
      },
    });

    if (!participant) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NotConversationMember`)
      );
    }

    if (!participant.isMuted) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.ConversationNotMuted`)
      );
    }

    await this.conversationParticipantRepository.update(
      { conversationId, accountId: account.id },
      { isMuted: false, mutedUntil: null }
    );

    return {
      message: this.i18n.t(`${this.i18nNamespace}.ConversationUnmuted`),
      data: {
        isMuted: false,
      },
    };
  }

  // === Helpers === //

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

  // === Private Helpers === //

  private async toggleConversationProperty(
    account: Account,
    conversationId: string,
    property: 'isPinned' | 'isArchived',
    enabledMessageKey: string,
    disabledMessageKey: string
  ): Promise<HttpResponse> {
    const participant = await this.conversationParticipantRepository.findOne({
      where: {
        conversationId,
        accountId: account.id,
        leftAt: IsNull(),
      },
    });

    if (!participant) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NotConversationMember`)
      );
    }

    const newValue = !participant[property];

    await this.conversationParticipantRepository.update(
      { conversationId, accountId: account.id },
      { [property]: newValue }
    );

    const messageKey = newValue ? enabledMessageKey : disabledMessageKey;

    return {
      message: this.i18n.t(`${this.i18nNamespace}.${messageKey}`),
      data: {
        [property]: newValue,
      },
    };
  }

  private validateConversationForManagingMembers(
    accountParticipant: ConversationParticipant | null
  ) {
    if (!accountParticipant || !accountParticipant.conversation)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.NoConversationFound`)
      );

    // Check if the conversation is a group conv
    if (accountParticipant.conversation.type !== ConversationType.GROUP)
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}.OnlyGroupConversations`)
      );

    // Only admins can add members to group
    if (accountParticipant.role !== ParticipantRole.ADMIN)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}.OnlyAdminCanManageMembers`)
      );
  }
}
