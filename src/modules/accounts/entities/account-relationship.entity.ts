import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { RelationshipType } from '../accounts.enums';

@Entity('account_relationships')
export class AccountRelationships {
  @PrimaryColumn()
  actorId!: number;

  @PrimaryColumn()
  targetId!: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor!: Account;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetId' })
  target!: Account;

  @Column({
    type: 'enum',
    enum: RelationshipType,
  })
  relationshipType!: RelationshipType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
