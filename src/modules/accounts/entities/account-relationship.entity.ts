import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { RelationshipType } from '../accounts.enums';

@Entity('account_relationships')
@Index(['actorId', 'targetId'], { unique: true })
export class AccountRelationships {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  actorId!: number;

  @Column()
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
