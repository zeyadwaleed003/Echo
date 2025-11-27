import {
  IsAlphanumeric,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';
import {
  AccountStatus,
  DirectMessagingStatus,
  Gender,
  Role,
} from '../accounts.enums';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Full name of the user',
    maxLength: 100,
    example: 'John Doe',
  })
  @IsString({
    message: i18nValidationMessage('validation.account.name.isString'),
  })
  @Length(1, 100, {
    message: i18nValidationMessage('validation.account.name.length'),
  })
  name!: string;

  @ApiProperty({
    description: 'Unique username',
    maxLength: 50,
    example: 'johndoe123',
  })
  @IsString({
    message: i18nValidationMessage('validation.account.username.isString'),
  })
  @Length(3, 50, {
    message: i18nValidationMessage('validation.account.username.length'),
  })
  @IsAlphanumeric(undefined, {
    message: i18nValidationMessage(
      'validation.account.username.isAlphanumeric'
    ),
  })
  username!: string;

  @ApiProperty({
    description: 'Email address',
    maxLength: 255,
    example: 'john.doe@example.com',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.account.email.isEmail') }
  )
  @Length(1, 255, {
    message: i18nValidationMessage('validation.account.email.length'),
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Account password (min 8 characters)',
    minLength: 8,
    maxLength: 255,
    example: 'SecurePass123!',
  })
  @IsString({
    message: i18nValidationMessage('validation.account.password.isString'),
  })
  @IsOptional()
  @Length(8, 255, {
    message: i18nValidationMessage('validation.account.password.length'),
  })
  password!: string;

  @ApiPropertyOptional({
    description: 'User biography',
    maxLength: 160,
    example: 'Software developer passionate about technology',
  })
  @IsString({
    message: i18nValidationMessage('validation.account.bio.isString'),
  })
  @IsOptional()
  @MaxLength(160, {
    message: i18nValidationMessage('validation.account.bio.maxLength'),
  })
  bio!: string;

  @ApiPropertyOptional({
    description: 'User location',
    maxLength: 30,
    example: 'New York, USA',
  })
  @IsString({
    message: i18nValidationMessage('validation.account.location.isString'),
  })
  @IsOptional()
  @Length(1, 30, {
    message: i18nValidationMessage('validation.account.location.length'),
  })
  location!: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    maxLength: 25,
    example: '+1234567890',
  })
  @IsOptional()
  @IsMobilePhone(
    undefined,
    {},
    { message: i18nValidationMessage('validation.account.phone.isMobilePhone') }
  )
  @Length(1, 25, {
    message: i18nValidationMessage('validation.account.phone.length'),
  })
  phone!: string;

  @ApiPropertyOptional({
    description: 'Enable notifications',
    example: true,
  })
  @IsBoolean({
    message: i18nValidationMessage(
      'validation.account.getNotifications.isBoolean'
    ),
  })
  @IsOptional()
  getNotifications!: boolean;

  @ApiPropertyOptional({
    description: 'Account verification status',
    example: false,
  })
  @IsBoolean({
    message: i18nValidationMessage('validation.account.isVerified.isBoolean'),
  })
  @IsOptional()
  isVerified!: boolean;

  @ApiPropertyOptional({
    description: 'Verification timestamp',
    type: Date,
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDate({
    message: i18nValidationMessage('validation.account.verifiedAt.isDate'),
  })
  @IsOptional()
  @Type(() => Date)
  verifiedAt!: Date;

  @ApiPropertyOptional({
    description: 'Date of birth',
    type: Date,
    example: '1990-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate({
    message: i18nValidationMessage('validation.account.birthDate.isDate'),
  })
  @Type(() => Date)
  birthDate!: Date;

  @ApiPropertyOptional({
    description: 'Preferred application language',
    maxLength: 50,
    example: 'en-US',
  })
  @IsString({
    message: i18nValidationMessage('validation.account.appLanguage.isString'),
  })
  @IsOptional()
  @MaxLength(50, {
    message: i18nValidationMessage('validation.account.appLanguage.maxLength'),
  })
  appLanguage!: string;

  @ApiPropertyOptional({
    description: 'Current country of the user',
    maxLength: 50,
    example: 'United States',
  })
  @IsString({
    message: i18nValidationMessage(
      'validation.account.currentCountry.isString'
    ),
  })
  @IsOptional()
  @MaxLength(50, {
    message: i18nValidationMessage(
      'validation.account.currentCountry.maxLength'
    ),
  })
  currentCountry!: string;

  @ApiPropertyOptional({
    description: 'User gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender, {
    message: i18nValidationMessage('validation.account.gender.isEnum'),
  })
  @IsOptional()
  gender!: Gender;

  @ApiPropertyOptional({
    description: 'Private account setting',
    example: false,
  })
  @IsBoolean({
    message: i18nValidationMessage('validation.account.isPrivate.isBoolean'),
  })
  @IsOptional()
  isPrivate!: boolean;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: AccountStatus,
    example: AccountStatus.ACTIVATED,
  })
  @IsEnum(AccountStatus, {
    message: i18nValidationMessage('validation.account.status.isEnum'),
  })
  @IsOptional()
  status!: AccountStatus;

  @ApiPropertyOptional({
    description: 'Allow tagging in posts',
    example: true,
  })
  @IsBoolean({
    message: i18nValidationMessage('validation.account.taggable.isBoolean'),
  })
  @IsOptional()
  taggable!: boolean;

  @ApiPropertyOptional({
    description: 'Display sensitive content setting',
    example: false,
  })
  @IsBoolean({
    message: i18nValidationMessage(
      'validation.account.displaySensitiveContent.isBoolean'
    ),
  })
  @IsOptional()
  displaySensitiveContent!: boolean;

  @ApiPropertyOptional({
    description: 'Direct messaging privacy setting',
    enum: DirectMessagingStatus,
    example: DirectMessagingStatus.EVERYONE,
  })
  @IsEnum(DirectMessagingStatus, {
    message: i18nValidationMessage('validation.account.directMessaging.isEnum'),
  })
  @IsOptional()
  directMessaging!: DirectMessagingStatus;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsUrl(
    {},
    {
      message: i18nValidationMessage('validation.account.profilePicture.isUrl'),
    }
  )
  @IsOptional()
  profilePicture!: string;

  @ApiPropertyOptional({
    description: 'Header image URL',
    example: 'https://example.com/header.jpg',
  })
  @IsUrl(
    {},
    { message: i18nValidationMessage('validation.account.header.isUrl') }
  )
  @IsOptional()
  header!: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role, {
    message: i18nValidationMessage('validation.account.role.isEnum'),
  })
  @IsOptional()
  role!: Role;
}
