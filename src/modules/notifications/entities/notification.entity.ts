import { Post } from '../../posts/entities/post.entity';
import { Account } from '../../accounts/entities/account.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  REPLY = 'reply',
  REPOST = 'repost',
  FOLLOW = 'follow',
  LIKE = 'like',
  MENTION = 'mention',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn()
  account!: Account;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  actor!: Account | null;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  post!: Post | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column('varchar')
  description!: string;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  actionPost!: Post | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
