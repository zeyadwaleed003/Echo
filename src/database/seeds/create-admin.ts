import { Account } from '../../modules/accounts/entities/account.entity';
import dataSource from '../data-source';
import { AccountStatus, Role } from '../../modules/accounts/accounts.enums';
import { hashCode } from '../../common/utils/functions';

async function createAdmin() {
  await dataSource.initialize();

  const accountRepo = dataSource.getRepository(Account);

  const existingAdmin = await accountRepo.findOne({
    where: { email: 'admin@echo.com' },
  });

  if (existingAdmin) return;

  const hashedPassword = await hashCode('admin');

  const admin = accountRepo.create({
    name: 'admin',
    email: 'admin@echo.com',
    username: 'admin',
    password: hashedPassword,
    role: Role.ADMIN,
    status: AccountStatus.ACTIVATED,
  });

  await accountRepo.save(admin);

  await dataSource.destroy();
}

createAdmin();
