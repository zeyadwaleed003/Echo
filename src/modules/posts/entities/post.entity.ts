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
import { Account } from '../../accounts/entities/account.entity';
import { PostType } from '../posts.enums';
import { MaxLength } from 'class-validator';

@Entity('posts')
@Index(['accountId'])
export class Post {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'bigint', nullable: false })
  accountId: number;

  @Column({ nullable: true })
  actionPostId?: number | null;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'actionPostId' })
  actionPost?: Post | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  @MaxLength(353)
  content: string | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  pinned: boolean;

  @Column({
    type: 'enum',
    enum: PostType,
  })
  type: PostType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
