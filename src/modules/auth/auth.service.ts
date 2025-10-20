import { Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { Repository } from 'typeorm';
import { AccountStatus } from '../accounts/accounts.enums';
import { ConflictException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private accountsRepository: Repository<Account>
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

      if (status === AccountStatus.INACTIVATED || AccountStatus.PENDING)
        this.sendOTP(account.email);
    }

    // If NOT ...

    // Create the account
    await this.accountsRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      status: AccountStatus.INACTIVATED,
    });

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
