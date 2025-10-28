import { BlockedWord } from './blocked-word.entity';
import { Account } from '../../accounts/entities/account.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('word_relationships')
export class WordRelationships {
  @PrimaryColumn()
  accountId!: number;

  @PrimaryColumn()
  blockedWordId!: number;

  @ManyToOne(() => Account)
  @JoinColumn()
  account!: Account;

  @ManyToOne(() => BlockedWord)
  @JoinColumn()
  blockedWord!: BlockedWord;

  @CreateDateColumn()
  createdAt!: Date;
}
