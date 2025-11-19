import { Account } from '../../modules/accounts/entities/account.entity';

declare global {
  namespace Express {
    interface Request {
      account?: Account;
    }
  }
}

export {};
