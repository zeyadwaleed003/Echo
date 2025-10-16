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

export enum RelationshipType {
  FOLLOW = 'follow',
  BLOCK = 'block',
  MUTE = 'mute',
}

@Entity('account_relationships')
export class AccountRelationships {
  @PrimaryColumn()
  actorId!: number;

  @PrimaryColumn()
  targetId!: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn()
  actor!: Account;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn()
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
