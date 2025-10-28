import { Account } from '../accounts/entities/account.entity';

export const ACCOUNT_SELECT_FIELDS: (keyof Account)[] = [
  'id',
  'name',
  'username',
  'email',
  'bio',
  'location',
  'phone',
  'getNotifications',
  'isVerified',
  'verifiedAt',
  'birthDate',
  'appLanguage',
  'currentCountry',
  'gender',
  'isPrivate',
  'status',
  'taggable',
  'displaySensitiveContent',
  'directMessaging',
  'profilePicture',
  'header',
  'role',
  'createdAt',
  'updatedAt',
];

export const ACCOUNT_SELECT_WITH_PASSWORD: (keyof Account)[] = [
  ...ACCOUNT_SELECT_FIELDS,
  'password',
];
