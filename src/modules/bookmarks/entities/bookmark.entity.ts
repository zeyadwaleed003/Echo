import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Account } from '../../accounts/entities/account.entity';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'bigint', nullable: false })
  postId: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookmarkedById' })
  bookmarkedBy: Account;

  @Column({ type: 'bigint', nullable: false })
  bookmarkedById: number;

  @CreateDateColumn()
  createdAt: Date;
}
