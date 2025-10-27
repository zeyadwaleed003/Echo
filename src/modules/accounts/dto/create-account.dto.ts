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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Full name of the user',
    maxLength: 100,
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Unique username',
    maxLength: 50,
    example: 'johndoe123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @ApiProperty({
    description: 'Email address',
    maxLength: 255,
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    description: 'Account password (min 8 characters)',
    minLength: 8,
    maxLength: 255,
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  password!: string;

  @ApiPropertyOptional({
    description: 'User biography',
    maxLength: 160,
    example: 'Software developer passionate about technology',
  })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  bio!: string;

  @ApiPropertyOptional({
    description: 'User location',
    maxLength: 30,
    example: 'New York, USA',
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  location!: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    maxLength: 25,
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  @MaxLength(25)
  phone!: string;

  @ApiPropertyOptional({
    description: 'Enable notifications',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  getNotifications!: boolean;

  @ApiPropertyOptional({
    description: 'Account verification status',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified!: boolean;

  @ApiPropertyOptional({
    description: 'Verification timestamp',
    type: Date,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  verifiedAt!: Date;

  @ApiPropertyOptional({
    description: 'Date of birth',
    type: Date,
    example: '1990-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  birthDate!: Date;

  @ApiPropertyOptional({
    description: 'Preferred application language',
    maxLength: 50,
    example: 'en-US',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  appLanguage!: string;

  @ApiPropertyOptional({
    description: 'Current country of the user',
    maxLength: 50,
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  currentCountry!: string;

  @ApiPropertyOptional({
    description: 'User gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender!: Gender;

  @ApiPropertyOptional({
    description: 'Private account setting',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate!: boolean;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: AccountStatus,
    example: AccountStatus.ACTIVATED,
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status!: AccountStatus;

  @ApiPropertyOptional({
    description: 'Allow tagging in posts',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  taggable!: boolean;

  @ApiPropertyOptional({
    description: 'Display sensitive content setting',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  displaySensitiveContent!: boolean;

  @ApiPropertyOptional({
    description: 'Direct messaging privacy setting',
    enum: DirectMessagingStatus,
    example: DirectMessagingStatus.EVERYONE,
  })
  @IsEnum(DirectMessagingStatus)
  @IsOptional()
  directMessaging!: DirectMessagingStatus;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsOptional()
  profilePicture!: string;

  @ApiPropertyOptional({
    description: 'Header image URL',
    example: 'https://example.com/header.jpg',
  })
  @IsString()
  @IsOptional()
  header!: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role)
  @IsOptional()
  role!: Role;
}
