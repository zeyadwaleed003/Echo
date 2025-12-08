import { Account } from '../../accounts/entities/account.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentType, DeletionType } from '../messages.enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.TEXT,
  })
  type: ContentType;

  @Column({
    type: 'text',
  })
  content: string;

  @Column({
    type: 'jsonb',
    default: {},
  })
  metadata: Record<string, any>;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: Account;

  @Column()
  senderId: number;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'replyToMessageId' })
  replyToMessage: Message;

  @Column({ nullable: true })
  replyToMessageId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  editedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date | null;

  @Column({
    type: 'enum',
    enum: DeletionType,
    nullable: true,
  })
  deletionType: DeletionType | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  isForwarded: boolean;
}
