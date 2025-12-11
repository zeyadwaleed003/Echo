import { Account } from '../../modules/accounts/entities/account.entity';
import dataSource from '../data-source';
import {
  AccountStatus,
  Role,
  Gender,
} from '../../modules/accounts/accounts.enums';
import { hashCode } from '../../common/utils/functions';

const baseNames = [
  'John',
  'Jane',
  'Alex',
  'Sarah',
  'Michael',
  'Emma',
  'David',
  'Olivia',
  'Chris',
  'Sophia',
  'Daniel',
  'Isabella',
  'James',
  'Mia',
  'Robert',
];

const baseUsernames = [
  'johndoe',
  'janedoe',
  'alexsmith',
  'sarahj',
  'mike',
  'emma',
  'dave',
  'olivia',
  'chris',
  'sophia',
  'dan',
  'bella',
  'james',
  'mia',
  'rob',
];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'echo.com'];

function generateVariation(base: string, index: number): string {
  const variations = [
    base,
    `${base}${index}`,
    `${base}_${index}`,
    `${base}.${index}`,
    `${base}${index * 10}`,
    `${base}_official`,
    `${base}.real`,
    `the_${base}`,
  ];

  return variations[index % variations.length]!;
}

function generateEmail(username: string, index: number): string {
  const domain = domains[index % domains.length];
  return `${username}@${domain}`;
}

function getRandomStatus(): AccountStatus {
  const statuses = [
    AccountStatus.ACTIVATED,
    AccountStatus.ACTIVATED,
    AccountStatus.ACTIVATED,
    AccountStatus.PENDING,
    AccountStatus.SUSPENDED,
  ];

  return statuses[Math.floor(Math.random() * statuses.length)]!;
}

function getRandomGender(): Gender | null {
  const genders = [Gender.MALE, Gender.FEMALE, null];
  return genders[Math.floor(Math.random() * genders.length)]!;
}

async function createTestAccounts() {
  await dataSource.initialize();

  const accountRepo = dataSource.getRepository(Account);

  const hashedPassword = await hashCode('password123');

  const accounts: Partial<Account>[] = [];

  for (let i = 0; i < 50; i++) {
    const baseNameIndex = i % baseNames.length;
    const baseName = baseNames[baseNameIndex];
    const baseUsername = baseUsernames[baseNameIndex];

    const name = generateVariation(baseName!, i);
    const username = generateVariation(baseUsername!, i);
    const email = generateEmail(username, i);

    const account: Partial<Account> = {
      name,
      username,
      email,
      password: hashedPassword,
      role: Role.USER, // Make 3 moderators
      status: getRandomStatus(),
      gender: getRandomGender(),
      isVerified: i % 3 === 0, // Every 3rd account is verified
      isPrivate: i % 5 === 0, // Every 5th account is private
      bio: i % 4 === 0 ? `Hi, I'm ${name}! Welcome to my profile.` : null,
      location:
        i % 3 === 0
          ? (['New York', 'London', 'Tokyo', 'Paris'][i % 4] ?? null)
          : null,
      birthDate: new Date(1990 + (i % 20), i % 12, (i % 28) + 1),
      getNotifications: i % 4 !== 0,
      taggable: i % 3 !== 0,
      displaySensitiveContent: i % 7 === 0,
    };

    accounts.push(account);
  }

  // Check for existing accounts and filter them out
  const existingEmails = accounts.map((a) => a.email) as string[];
  const existing = await accountRepo.find({
    where: existingEmails.map((email) => ({ email })),
  });

  const existingEmailSet = new Set(existing.map((a) => a.email));
  const newAccounts = accounts.filter((a) => !existingEmailSet.has(a.email!));

  if (newAccounts.length > 0) {
    const accountEntities = accountRepo.create(newAccounts);
    await accountRepo.save(accountEntities);
    console.log(`Created ${newAccounts.length} test accounts`);
  } else {
    console.log('All accounts already exist');
  }

  await dataSource.destroy();
}

createTestAccounts().catch(console.error);
