import { Exclude, Expose } from 'class-transformer';
import {
  AccountStatus,
  DirectMessagingStatus,
  Gender,
  Role,
} from '../accounts.enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Exclude()
@Entity('accounts')
export class Account {
  @Expose()
  @PrimaryGeneratedColumn('increment') // Bigserial
  id: number;

  @Expose()
  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string;

  @Expose()
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  username: string | null;

  @Expose()
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  password: string | null;

  @Expose()
  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  bio: string | null;

  @Expose()
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  location: string | null;

  @Expose()
  @Column({
    type: 'varchar',
    length: 25,
    nullable: true,
    unique: true,
  })
  phone: string | null;

  @Expose()
  @Column({
    type: 'boolean',
    default: true,
  })
  getNotifications: boolean;

  @Expose()
  @Column({
    type: 'boolean',
    default: false,
  })
  isVerified: boolean;

  @Expose()
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt: Date | null;

  @Expose()
  @Column({
    type: 'date',
    nullable: true,
  })
  birthDate: Date | null;

  @Expose()
  @Column({
    type: 'varchar',
    length: 50,
    default: 'english',
  })
  appLanguage: string;

  @Expose()
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  currentCountry: string | null;

  @Expose()
  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender | null;

  @Expose()
  @Column({
    type: 'boolean',
    default: false,
  })
  isPrivate: boolean;

  @Expose()
  @Column({
    type: 'enum',
    enum: AccountStatus,
  })
  status: AccountStatus;

  @Expose()
  @Column({
    type: 'boolean',
    default: true,
  })
  taggable: boolean;

  @Expose()
  @Column({
    type: 'boolean',
    default: false,
  })
  displaySensitiveContent: boolean;

  @Expose()
  @Column({
    type: 'enum',
    enum: DirectMessagingStatus,
    default: DirectMessagingStatus.NONE,
  })
  directMessaging: DirectMessagingStatus;

  @Expose()
  @Column({
    type: 'text',
    nullable: true,
  })
  profilePicture: string | null;

  @Expose()
  @Column({
    type: 'text',
    nullable: true,
  })
  header: string | null;

  @Expose()
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  verificationCode: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  verificationCodeExpiresAt: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordResetCode: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  passwordResetCodeExpiresAt: Date | null;

  @Expose()
  @CreateDateColumn()
  createdAt: Date;

  @Expose()
  @UpdateDateColumn()
  updatedAt: Date;
}
