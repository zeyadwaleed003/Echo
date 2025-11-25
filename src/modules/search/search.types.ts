import { Account } from '../accounts/entities/account.entity';
import { Post } from '../posts/entities/post.entity';

export type AccountIndex = Pick<
  Account,
  'id' | 'username' | 'name' | 'createdAt' | 'status'
>;

export type PostIndex = Pick<
  Post,
  'id' | 'content' | 'createdAt' | 'accountId'
> & { isPrivate: boolean };
