import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { PostType } from '../posts.enums';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({ type: 'bigint', nullable: false })
  accountId!: number;

  @Column()
  actionPostId?: number | null;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'actionPostId' })
  actionPost?: Post | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  content!: string | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  pinned!: boolean;

  @Column({
    type: 'enum',
    enum: PostType,
  })
  type!: PostType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
