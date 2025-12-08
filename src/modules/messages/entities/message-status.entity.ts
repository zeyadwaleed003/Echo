import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';
import { Account } from '../../accounts/entities/account.entity';
import { MessageStatusType } from '../messages.enum';

@Entity('message_status')
@Unique(['messageId', 'accountId', 'status']) // New message status = New row
export class MessageStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column()
  messageId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: number;

  @Column({
    type: 'enum',
    enum: MessageStatusType,
  })
  status: MessageStatusType;

  @CreateDateColumn()
  timestamp: Date;
}
