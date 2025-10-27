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
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
import {
  comparePassword,
  hashPassword,
  parseExpiresInMs,
} from 'src/common/utils/functions';
import { LoginDto } from './dto/login.dto';
import { ACCOUNT_SELECT_WITH_PASSWORD } from './auth.select';
import { RefreshToken } from './entities/refresh-token.entity';
import { RevocationReason } from './auth.enums';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private logger = new Logger('Auth Service');

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
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

    const res: APIResponse = {
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

        const res: APIResponse = {
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

        const res: APIResponse = {
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

    const res: APIResponse = {
      statusCode: HttpStatus.CREATED,
      message:
        'Account created and verified successfully. Please complete your profile setup',
      data: newAccount,
      accessToken,
      refreshToken,
    };

    return res;
  }

  private checkAccountActivation(status: AccountStatus) {
    if (status === AccountStatus.INACTIVATED)
      throw new ForbiddenException(
        'Please verify your email address to activate your account'
      );

    if (status === AccountStatus.PENDING)
      throw new ForbiddenException(
        'Please complete your profile setup before logging in'
      );

    if (status === AccountStatus.DEACTIVATED)
      throw new ForbiddenException(
        'This account has been deactivated. Please contact support'
      );

    if (status === AccountStatus.SUSPENDED)
      throw new ForbiddenException(
        'This account has been suspended. Please contact support'
      );
  }

  async login(loginDto: LoginDto) {
    // check if the provided field is an email
    const isEmail = loginDto.emailOrUsername.includes('@');

    const account = await this.accountsRepository.findOne({
      where: isEmail
        ? { email: loginDto.emailOrUsername }
        : { username: loginDto.emailOrUsername },
      select: ACCOUNT_SELECT_WITH_PASSWORD,
    });

    if (
      !account ||
      !account.password ||
      !(await comparePassword(loginDto.password, account.password))
    )
      throw new UnauthorizedException('Invalid email/username or password');

    this.checkAccountActivation(account.status);

    const { password, ...cleanAccount } = account;

    const accessToken =
      await this.tokenService.generateAccessToken(cleanAccount);

    const refreshToken = await this.tokenService.generateRefreshToken({
      id: cleanAccount.id,
      sessionId: uuidv4(),
    });

    const result: APIResponse = {
      data: cleanAccount,
      accessToken,
      refreshToken,
    };

    return result;
  }

  async refreshToken(refreshTokenValue: string) {
    // Verify Token
    const verifiedToken =
      await this.tokenService.verifyRefreshToken(refreshTokenValue);

    // Find the Token's account
    const account = await this.accountsRepository.findOneBy({
      id: verifiedToken.id,
    });
    if (!account) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Find the token in the refresh token table by the token's session id
    const storedRefreshToken = await this.refreshTokenRepository.findOneBy({
      sessionId: verifiedToken.sessionId,
    });
    if (!storedRefreshToken || account.id !== storedRefreshToken.accountId)
      throw new UnauthorizedException('Refresh token is invalid or expired');

    // Check if the token is revoked
    if (storedRefreshToken.revokedAt) {
      // Using a token that has been revoked - logout the user from all devices - security reseon
      await this.refreshTokenRepository.update(
        { accountId: account.id },
        { revokedAt: new Date(), revocationReason: RevocationReason.REUSE }
      );

      this.logger.warn(
        `Revoked refresh token reuse detected for account ${storedRefreshToken.accountId}`
      );

      throw new UnauthorizedException(
        'Suspicious activity detected. Please sign in again.'
      );
    }

    // Check account's status
    if (account.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException(
        'This account has been deactivated. Please contact support'
      );
    }

    if (account.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException(
        'This account has been suspended. Please contact support'
      );
    }

    // Generate new access token
    const accessToken = await this.tokenService.generateAccessToken({
      ...account,
    });

    // Generate new Refresh token
    const newRefreshToken = await this.tokenService.generateRefreshToken({
      id: account.id,
      sessionId: uuidv4(),
    });

    // Revoke the old refresh token
    await this.refreshTokenRepository.update(
      {
        id: storedRefreshToken.id,
      },
      {
        revokedAt: new Date(),
        revocationReason: RevocationReason.ROTATION,
      }
    );

    const result: APIResponse = {
      data: account,
      accessToken,
      refreshToken: newRefreshToken,
    };

    return result;
  }

  async logout(refreshToken: string) {
    const verifiedToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.refreshTokenRepository.update(
      { sessionId: verifiedToken.sessionId, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revocationReason: RevocationReason.LOGOUT,
      }
    );

    const result: APIResponse = {
      message: 'Logged out successfully',
    };

    return result;
  }

  async changePassword(changePasswordDto: ChangePasswordDto, account: Account) {
    // Get the account password
    const { password } = (await this.accountsRepository.findOne({
      where: { id: account.id },
      select: ['password'],
    }))!;

    // Compare the given old password with the account actual password
    if (!password)
      throw new ForbiddenException('No password set for this account');

    if (!(await comparePassword(changePasswordDto.oldPassword, password)))
      throw new UnauthorizedException('Old password is incorrect');

    // Update the account with the new password
    const hashedPassword = await hashPassword(changePasswordDto.password);

    await this.accountsRepository.update(
      { id: account.id },
      { password: hashedPassword }
    );

    // logout the user from all his active sessions
    await this.refreshTokenRepository.update(
      { accountId: account.id },
      {
        revokedAt: new Date(),
        revocationReason: RevocationReason.PASSWORD_CHANGE,
      }
    );

    const result: APIResponse = {
      message: 'Password changed successfully. Please sign in again',
    };

    return result;
  }
}
