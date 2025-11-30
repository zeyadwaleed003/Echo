import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('post_files')
export class PostFiles {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column('text')
  url: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'bigint' })
  postId: number;

  @CreateDateColumn()
  createdAt: Date;
}
