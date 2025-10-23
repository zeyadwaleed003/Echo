import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  AccountStatus,
  DirectMessagingStatus,
  Gender,
  Role,
} from '../accounts.enums';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  password!: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  bio!: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  location!: string;

  @IsString()
  @IsOptional()
  @MaxLength(25)
  phone!: string;

  @IsBoolean()
  @IsOptional()
  getNotifications!: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified!: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  verifiedAt!: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  birthDate!: Date;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  appLanguage!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  currentCountry!: string;

  @IsEnum(Gender)
  @IsOptional()
  gender!: Gender;

  @IsBoolean()
  @IsOptional()
  isPrivate!: boolean;

  @IsEnum(AccountStatus)
  @IsOptional()
  status!: AccountStatus;

  @IsBoolean()
  @IsOptional()
  taggable!: boolean;

  @IsBoolean()
  @IsOptional()
  displaySensitiveContent!: boolean;

  @IsEnum(DirectMessagingStatus)
  @IsOptional()
  directMessaging!: DirectMessagingStatus;

  @IsString()
  @IsOptional()
  profilePicture!: string;

  @IsString()
  @IsOptional()
  header!: string;

  @IsEnum(Role)
  @IsOptional()
  role!: Role;
}
