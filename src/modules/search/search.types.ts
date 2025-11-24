import { Account } from '../accounts/entities/account.entity';
import { Post } from '../posts/entities/post.entity';

export type AccountDocument = Pick<
  Account,
  'id' | 'username' | 'name' | 'createdAt' | 'status'
>;

export type PostDocument = Pick<Post, 'id' | 'content' | 'createdAt'>;
