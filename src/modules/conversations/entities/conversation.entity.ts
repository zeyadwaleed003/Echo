import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationType } from '../conversations.enums';
import { Account } from '../../accounts/entities/account.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
    nullable: false,
  })
  type: ConversationType;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  name: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  avatar: string | null;

  @Column({
    type: 'varchar',
    length: '255',
    nullable: true,
  })
  description: string | null;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: Account;

  @Column({
    nullable: false,
  })
  createdById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;
}
