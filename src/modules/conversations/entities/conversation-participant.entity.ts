import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { ParticipantRole } from '../conversations.enums';
import { Account } from '../../accounts/entities/account.entity';

@Entity('conversation_participants')
@Index(['conversationId', 'accountId'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
    nullable: false,
  })
  role: ParticipantRole;

  // Tracks when user cleared chat
  // Default value is the row creation date so that a new group member can't view messages before joining the group
  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  clearedAt: Date;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  isMuted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  mutedUntil: Date | null;

  @Column({
    type: 'jsonb',
    default: {},
  })
  customNotifications: Record<string, any>; // This is the type for now

  @Column({
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isPinned: boolean;

  @Column({
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isArchived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastReadAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: number;
}
