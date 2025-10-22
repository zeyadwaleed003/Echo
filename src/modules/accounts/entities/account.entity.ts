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

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('increment') // Bigserial
  id!: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  username!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  password!: string | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  bio!: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  location!: string | null;

  @Column({
    type: 'varchar',
    length: 25,
    nullable: true,
    unique: true,
  })
  phone!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  getNotifications!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  isVerified!: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt!: Date | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  birthDate!: Date | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'english',
  })
  appLanguage!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  countryCreated!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  countryCurrent!: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender!: Gender | null;

  @Column({
    type: 'boolean',
    default: false,
  })
  isPrivate!: boolean;

  @Column({
    type: 'enum',
    enum: AccountStatus,
  })
  status!: AccountStatus;

  @Column({
    type: 'boolean',
    default: true,
  })
  taggable!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  displaySensitiveContent!: boolean;

  @Column({
    type: 'enum',
    enum: DirectMessagingStatus,
    default: DirectMessagingStatus.NONE,
  })
  directMessaging!: DirectMessagingStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  profilePicture!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  header!: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  verificationCode!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  verificationCodeExpiresAt!: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordResetCode!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  passwordResetCodeExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
