import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { hash, compare } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { AccountStatus } from '../accounts/accounts.enums';
import { SignupDto } from './dto/signup.dto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { APIResponse } from 'src/common/types/api.types';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { TokenService } from '../token/token.service';
import { CookieOptions, Response } from 'express';
import { parseExpiresInMs } from 'src/common/utils/functions';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID')
    );
  }

  private generateOTP(length = 6) {
    const max = 10 ** length;
    const num = randomInt(0, max);
    return num.toString().padStart(length, '0');
  }

  private async hashOTP(otp: string) {
    const saltRounds = 10;
    return await hash(otp, saltRounds);
  }

  private async compareHash(code: string, hash: string) {
    return await compare(code, hash);
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

  sendCookie(res: Response, name: string, val: string) {
    const options: CookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: this.configService.get('NODE_ENV') === 'production', // In production cookie will be sent only via HTTPs - encrypted
      maxAge: 7 * 24 * 60 * 60 * 100, // default max age of 7 days
    };

    if (name === 'refreshToken')
      options.maxAge = parseExpiresInMs(
        this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN')!
      );

    res.cookie(name, val, options);
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

      if (status === AccountStatus.PENDING)
        throw new ForbiddenException(
          'You are already registered. Please complete your profile setup'
        );

      if (status === AccountStatus.INACTIVATED)
        return await this.sendOTP(account.email, account.name);
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
    await this.generateAndSendOTP(signupDto.email, signupDto.name);

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

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    // Find account using email
    const account = await this.accountsRepository
      .createQueryBuilder('account')
      .where('account.email = :email', { email: verifyAccountDto.email })
      .addSelect([
        'account.verificationCode',
        'account.verificationCodeExpiresAt',
      ])
      .getOne();

    if (!account)
      throw new ForbiddenException('No account found with this email address');

    if (account.status === AccountStatus.ACTIVATED)
      throw new ConflictException('An account with this email already exists');

    if (account.status === AccountStatus.DEACTIVATED)
      throw new ForbiddenException(
        'This account has been deactivated. Please contact support'
      );

    if (account.status === AccountStatus.SUSPENDED)
      throw new ForbiddenException(
        'This account has been suspended. Please contact support'
      );

    if (account.status === AccountStatus.PENDING)
      throw new ForbiddenException(
        'You are already registered. Please complete your profile setup'
      );

    if (!account.verificationCode || !account.verificationCodeExpiresAt)
      throw new ForbiddenException(
        'No verification code found. Please request a new one'
      );

    // otp = stored otp
    const isEqual = await this.compareHash(
      verifyAccountDto.verificationCode,
      account.verificationCode
    );

    if (!isEqual)
      throw new ForbiddenException(
        'Invalid verification code. Please check the code and try again'
      );

    // Date comparison
    if (new Date() > account.verificationCodeExpiresAt)
      throw new ForbiddenException(
        'Verification code has expired. Please request a new one'
      );

    // Update the account
    await this.accountsRepository.update(
      { email: verifyAccountDto.email },
      {
        verificationCode: null,
        verificationCodeExpiresAt: null,
        status: AccountStatus.PENDING,
      }
    );

    const { verificationCode, verificationCodeExpiresAt, ...data } = account;

    const accessToken = await this.tokenService.generateAccessToken(data);
    const refreshToken = await this.tokenService.generateRefreshToken({
      id: account.id,
      sessionId: uuidv4(),
    });

    const res: APIResponse & { refreshToken: string } = {
      message:
        'Email verified successfully. Please complete your profile setup.',
      data,
      accessToken,
      refreshToken,
    };

    return res;
  }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    const { idToken } = googleAuthDto;
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
    });

    const payload = ticket.getPayload();
    if (!payload)
      throw new UnauthorizedException('Invalid Google ID token Payload');

    if (!payload.email_verified)
      throw new UnauthorizedException('Your google account is not verified');

    if (!payload.email)
      throw new UnauthorizedException('Email not provided by Google');

    const account = await this.accountsRepository.findOneBy({
      email: payload.email,
    });

    if (account) {
      if (account.status === AccountStatus.DEACTIVATED)
        throw new ForbiddenException(
          'This account has been deactivated. Please contact support'
        );

      if (account.status === AccountStatus.SUSPENDED)
        throw new ForbiddenException(
          'This account has been suspended. Please contact support'
        );

      // login
      if (account.status === AccountStatus.ACTIVATED) {
        const accessToken =
          await this.tokenService.generateAccessToken(account);

        const refreshToken = await this.tokenService.generateRefreshToken({
          id: account.id,
          sessionId: uuidv4(),
        });

        const res: APIResponse & { refreshToken: string } = {
          statusCode: HttpStatus.OK,
          message: 'Logged in successfully',
          data: account,
          accessToken,
          refreshToken,
        };

        return res;
      }

      // signup
      if (account.status === AccountStatus.PENDING)
        throw new ForbiddenException(
          'You are already registered. Please complete your profile setup'
        );

      if (account.status === AccountStatus.INACTIVATED) {
        account.status = AccountStatus.PENDING;
        const updatedAccount = await this.accountsRepository.save(account);

        const accessToken =
          await this.tokenService.generateAccessToken(updatedAccount);

        const refreshToken = await this.tokenService.generateRefreshToken({
          id: updatedAccount.id,
          sessionId: uuidv4(),
        });

        const res: APIResponse & { refreshToken: string } = {
          statusCode: HttpStatus.OK,
          message:
            'Email verified successfully. Please complete your profile setup',
          data: updatedAccount,
          accessToken,
          refreshToken,
        };

        return res;
      }
    }

    const newAccount = this.accountsRepository.create({
      name: payload.name!,
      email: payload.email,
      status: AccountStatus.PENDING,
    });

    await this.accountsRepository.save(newAccount);

    const accessToken = await this.tokenService.generateAccessToken(newAccount);

    const refreshToken = await this.tokenService.generateRefreshToken({
      id: newAccount.id,
      sessionId: uuidv4(),
    });

    const res: APIResponse & { refreshToken: string } = {
      statusCode: HttpStatus.CREATED,
      message:
        'Account created and verified successfully. Please complete your profile setup',
      data: newAccount,
      accessToken,
      refreshToken,
    };

    return res;
  }
}
