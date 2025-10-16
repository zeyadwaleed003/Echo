import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Account } from '../../accounts/entities/account.entity';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn()
  post!: Post;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookmarkedBy', referencedColumnName: 'id' })
  bookmarkedBy!: Account;

  @CreateDateColumn()
  createdAt!: Date;
}
