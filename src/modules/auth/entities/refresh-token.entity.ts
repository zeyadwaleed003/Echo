import { Account } from '../../accounts/entities/account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RevocationReason } from '../auth.enums';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  account!: Account;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'uuid' })
  sessionId!: string;

  @Column({
    type: 'enum',
    enum: RevocationReason,
    nullable: true,
  })
  revocationReason!: RevocationReason | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;
}
