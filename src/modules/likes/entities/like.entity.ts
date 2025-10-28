import { Account } from '../../accounts/entities/account.entity';
import { Post } from '../../posts/entities/post.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn()
  post!: Post;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn()
  account!: Account;

  @CreateDateColumn()
  createdAt!: Date;
}
