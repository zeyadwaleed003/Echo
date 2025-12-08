import { Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blocked_words')
export class BlockedWord {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text', unique: true })
  @Length(3, 100, {
    message: 'Blocked word must be between 3 and 100 characters',
  })
  text: string;
}
