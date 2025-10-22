import { randomInt } from 'crypto';
import { hash } from 'bcrypt';
import { lookup } from 'geoip-lite';
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  Scope,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { AccountStatus } from '../accounts/accounts.enums';
import { SignupDto } from './dto/signup.dto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { APIResponse } from 'src/common/types/api.types';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  private generateOTP(length = 6) {
    const max = 10 ** length;
    const num = randomInt(0, max);
    return num.toString().padStart(length, '0');
  }

  private async hashOTP(otp: string) {
    const saltRounds = 10;
    return await hash(otp, saltRounds);
  }

  private async generateAndSendOTP(email: string, name: string) {
    // Generate the OTP
    const otp = this.generateOTP();

    // Sent the email with the otp
    await this.emailService.sendOTPEmail(email, otp, name);

    // Hash the otp
    const hashedOTP = await this.hashOTP(otp);

    // Store the otp in the database with a ttl
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() +
        this.configService.get<number>('VERIFICATION_OTP_EXPIRES_IN')!
    );

    await this.accountsRepository.update(
      {
        email,
      },
      {
        verificationCode: hashedOTP,
        verificationCodeExpiresAt: expiresAt,
      }
    );
  }

  // This code is not working as I wanted
  private getCountryFromIP() {
    const ip =
      this.request.ip ||
      this.request.headers['x-forwarded-for'] ||
      this.request.socket.remoteAddress;

    const geo = lookup(ip as string);
    return geo?.country || 'UNKNOWN';
  }

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
        this.sendOTP(account.email, account.name);
    }

    // If NOT ...

    // Get the country the user created his account from
    const countryCreated = this.getCountryFromIP();

    // Create the account
    const user = this.accountsRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      status: AccountStatus.INACTIVATED,
      countryCreated, // Add this field to your Account entity
      countryCurrent: countryCreated,
    });

    await this.accountsRepository.save(user);

    // OTP generation and send email
    await this.generateAndSendOTP(signupDto.email, signupDto.name);

    // BE CAREFULL OF THE DIFFERENT STATUS CODES!!!!!
    const res: APIResponse = {
      message:
        'Account created successfully. Please check your email for the verification code.',
    };

    return res;
  }

  async sendOTP(email: string, name: string) {
    await this.generateAndSendOTP(email, name);

    return {
      message:
        'A verification code has been sent to your email address. Please check your inbox.',
    };
  }
}
