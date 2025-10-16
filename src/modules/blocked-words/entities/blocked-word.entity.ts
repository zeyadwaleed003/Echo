import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blocked_words')
export class BlockedWord {
  @PrimaryGeneratedColumn('increment')
  id!: string;

  @Column({ type: 'text' })
  text!: string;
}
