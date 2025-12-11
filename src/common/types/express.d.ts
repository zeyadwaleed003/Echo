import { Account } from '../../modules/accounts/entities/account.entity';

declare global {
  namespace Express {
    interface Request {
      account?: Account;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    account?: Account;
  }
}

export {};
