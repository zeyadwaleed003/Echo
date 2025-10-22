import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { AccountStatus } from '../accounts/accounts.enums';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>
  ) {}

  private async generateAndSendOTP(email: string) {}

  async signup(signupDto: SignupDto) {
    // Check if the email is in the database
    const account = await this.accountsRepository.findOneBy({
      email: signupDto.email,
    });

    // If
    if (account) {
      const { status } = account;

      if (status === AccountStatus.ACTIVATED)
        throw new ConflictException(
          'An account with this email already exists'
        );

      if (status === AccountStatus.DEACTIVATED)
        throw new ForbiddenException(
          'This account has been deactivated. Please contact support'
        );

      if (status === AccountStatus.SUSPENDED)
        throw new ForbiddenException(
          'This account has been suspended. Please contact support'
        );

      if (
        status === AccountStatus.INACTIVATED ||
        status === AccountStatus.PENDING
      )
        this.sendOTP(account.email);
    }

    // If NOT ...

    // Create the account
    const user = this.accountsRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      status: AccountStatus.INACTIVATED,
    });

    await this.accountsRepository.save(user);

    // OTP generation and send email
    await this.generateAndSendOTP(signupDto.email);

    // BE CAREFULL OF THE DIFFERENT STATUS CODES!!!!!
  }

  async sendOTP(email: string) {
    return {
      message:
        'An OTP has been sent to your email address. Please check your inbox.',
    };
  }
}
