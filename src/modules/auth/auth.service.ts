import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { AccountStatus } from '../accounts/accounts.enums';
import { SignupDto } from './dto/signup.dto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { APIResponse } from 'src/common/types/api.types';
import { VerifyOtpDto } from './dto/verify-account.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { TokenService } from '../token/token.service';
import { CookieOptions, Response } from 'express';
import {
  compareHash,
  hashCode,
  parseExpiresInMs,
} from 'src/common/utils/functions';
import { LoginDto } from './dto/login.dto';
import { ACCOUNT_SELECT_WITH_PASSWORD } from './auth.select';
import { RefreshToken } from './entities/refresh-token.entity';
import { RevocationReason } from './auth.enums';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CompleteSetupDto } from './dto/complete-setup.dto';
import { SearchService } from '../search/search.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private logger = new Logger('Auth Service');
  private readonly i18nAuthNamespace = 'messages.auth.';

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    @Inject(forwardRef(() => SearchService))
    private readonly searchService: SearchService,
    private readonly i18n: I18nService
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

  private async generateAndSendVerificationEmail(email: string, name: string) {
    // Generate the OTP
    const otp = this.generateOTP();

    // Sent the email with the otp
    await this.emailService.sendVerificationEmail(email, otp, name);

    // Hash the otp
    const hashedOTP = await hashCode(otp);

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

  async signup(signupDto: SignupDto): Promise<APIResponse> {
    // Check if the email is in the database
    const account = await this.accountsRepository.findOneBy({
      email: signupDto.email,
    });

    // If
    if (account) {
      const { status } = account;

      if (status === AccountStatus.INACTIVATED)
        return await this.resendVerificationEmail(account.email);

      throw new ConflictException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountExists`)
      );
    }

    // If NOT ...

    // Create the account
    const newAccount = this.accountsRepository.create({
      name: signupDto.name,
      email: signupDto.email,
      status: AccountStatus.INACTIVATED,
    });
    await this.accountsRepository.save(newAccount);

    // OTP generation and send email
    await this.generateAndSendVerificationEmail(
      signupDto.email,
      signupDto.name
    );

    return {
      message: this.i18n.t(`${this.i18nAuthNamespace}` + `accountCreated`),
    };
  }

  async resendVerificationEmail(email: string) {
    this.logger.log(`Resend verification email requested for: ${email}`);
    const account = await this.accountsRepository.findOneBy({ email });

    const result: APIResponse = {
      message: this.i18n.t(`${this.i18nAuthNamespace}` + `verificationSent`),
    };

    if (!account) {
      this.logger.warn(
        `No account found for email: ${email} - Resend Verification Email Context`
      );
      return result;
    }

    if (account.status !== AccountStatus.INACTIVATED) {
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `cannotResendVerification`)
      );
    }

    await this.generateAndSendVerificationEmail(email, account.name);

    return result;
  }

  async sendCompleteProfileSetupResponse(
    id: number,
    error: boolean = false,
    message: string = this.i18n.t(`${this.i18nAuthNamespace}` + `emailVerified`)
  ): Promise<APIResponse> {
    const setupToken = await this.tokenService.generateSetupToken({
      id,
    });

    if (error)
      throw new ForbiddenException({
        message: message,
        error: 'ProfileSetupRequered',
        setupToken,
      });

    return {
      message: message,
      setupToken,
    };
  }

  async verifyAccount(verifyAccountDto: VerifyOtpDto) {
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
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `noAccountFound`)
      );

    if (account.status === AccountStatus.ACTIVATED)
      throw new ConflictException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountExists`)
      );

    if (account.status === AccountStatus.DEACTIVATED)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountDeactivated`)
      );

    if (account.status === AccountStatus.SUSPENDED)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountSuspended`)
      );

    if (account.status === AccountStatus.PENDING)
      await this.sendCompleteProfileSetupResponse(
        account.id,
        true,
        this.i18n.t(`${this.i18nAuthNamespace}` + `completeProfileSetup`)
      );

    if (!account.verificationCode || !account.verificationCodeExpiresAt)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `noVerificationCode`)
      );

    // otp = stored otp
    const isEqual = await compareHash(
      verifyAccountDto.verificationCode,
      account.verificationCode
    );

    if (!isEqual)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `invalidVerificationCode`)
      );

    // Date comparison
    if (new Date() > account.verificationCodeExpiresAt)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `verificationCodeExpired`)
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
    this.logger.log(`Account verified for email: ${verifyAccountDto.email}`);

    return await this.sendCompleteProfileSetupResponse(account.id);
  }

  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<APIResponse> {
    const { idToken } = googleAuthDto;
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      this.logger.error('Invalid Google ID token Payload');
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `invalidGoogleToken`)
      );
    }

    if (!payload.email_verified)
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `googleAccountNotVerified`)
      );
    if (!payload.email)
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `emailNotProvided`)
      );

    const account = await this.accountsRepository.findOneBy({
      email: payload.email,
    });

    if (account) {
      if (account.status === AccountStatus.DEACTIVATED)
        await this.sendReactivationToken(account.id);

      if (account.status === AccountStatus.SUSPENDED)
        throw new ForbiddenException(
          this.i18n.t(`${this.i18nAuthNamespace}` + `accountSuspended`)
        );

      // login
      if (account.status === AccountStatus.ACTIVATED) {
        const accessToken =
          await this.tokenService.generateAccessToken(account);

        const refreshToken = await this.tokenService.generateRefreshToken({
          id: account.id,
          sessionId: uuidv4(),
        });

        return {
          statusCode: HttpStatus.OK,
          message: this.i18n.t(
            `${this.i18nAuthNamespace}` + `loggedInSuccessfully`
          ),
          data: account,
          accessToken,
          refreshToken,
        };
      }

      // signup
      if (account.status === AccountStatus.PENDING)
        await this.sendCompleteProfileSetupResponse(
          account.id,
          true,
          this.i18n.t(`${this.i18nAuthNamespace}` + `alreadyRegistered`)
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

        return {
          statusCode: HttpStatus.OK,
          message: this.i18n.t(`${this.i18nAuthNamespace}` + `emailVerified`),
          data: updatedAccount,
          accessToken,
          refreshToken,
        };
      }
    } else {
      this.logger.log(
        `Creating new Google account for email: ${payload.email}`
      );
    }

    const newAccount = this.accountsRepository.create({
      name: payload.name!,
      email: payload.email,
      status: AccountStatus.PENDING,
    });
    await this.accountsRepository.save(newAccount);

    return await this.sendCompleteProfileSetupResponse(
      newAccount.id,
      false,
      this.i18n.t(`${this.i18nAuthNamespace}` + `googleAccountCreated`)
    );
  }

  private async sendReactivationToken(id: number) {
    const reactivationToken = await this.tokenService.generateReactivationToken(
      { id }
    );

    throw new ForbiddenException({
      message: this.i18n.t(
        `${this.i18nAuthNamespace}` + `accountDeactivatedError`
      ),
      error: 'AccountDeactivated',
      reactivationToken,
    });
  }

  private async checkAccountActivation(status: AccountStatus, id: number) {
    if (status === AccountStatus.INACTIVATED)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `verifyEmailToActivate`)
      );

    if (status === AccountStatus.PENDING)
      await this.sendCompleteProfileSetupResponse(
        id,
        true,
        this.i18n.t(`${this.i18nAuthNamespace}` + `completeProfileBeforeLogin`)
      );

    if (status === AccountStatus.DEACTIVATED)
      await this.sendReactivationToken(id);

    if (status === AccountStatus.SUSPENDED)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountSuspended`)
      );
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for: ${loginDto.emailOrUsername}`);
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
      !(await compareHash(loginDto.password, account.password))
    ) {
      this.logger.warn(
        `Invalid login credentials for: ${loginDto.emailOrUsername}`
      );
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `invalidCredentials`)
      );
    }

    await this.checkAccountActivation(account.status, account.id);

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

    this.logger.log(`Login successful for: ${loginDto.emailOrUsername}`);
    return result;
  }

  async logoutFromAllDevices(accountId: number) {
    await this.refreshTokenRepository.update(
      { accountId },
      { revokedAt: new Date(), revocationReason: RevocationReason.REUSE }
    );
  }

  async refreshToken(refreshTokenValue: string) {
    // Verify Token
    const verifiedToken =
      await this.tokenService.verifyRefreshToken(refreshTokenValue);

    // Find the Token's account
    const account = await this.accountsRepository.findOneBy({
      id: verifiedToken.id,
      status: In([
        AccountStatus.ACTIVATED,
        AccountStatus.DEACTIVATED,
        AccountStatus.SUSPENDED,
      ]),
    });
    if (!account)
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `refreshTokenInvalid`)
      );

    // Find the token in the refresh token table by the token's session id
    const storedRefreshToken = await this.refreshTokenRepository.findOneBy({
      sessionId: verifiedToken.sessionId,
    });
    if (!storedRefreshToken || account.id !== storedRefreshToken.accountId)
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `refreshTokenInvalid`)
      );

    // Check if the token is revoked
    if (storedRefreshToken.revokedAt) {
      this.logger.warn(
        `Revoked refresh token reuse detected for account ${storedRefreshToken.accountId}`
      );

      // Using a token that has been revoked - logout the user from all devices - security reseon
      await this.logoutFromAllDevices(account.id);

      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `suspiciousActivity`)
      );
    }

    // Check account's status
    if (account.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException(
        this.i18n.t(
          `${this.i18nAuthNamespace}` + `accountDeactivatedReactivate`
        )
      );
    }

    if (account.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountSuspended`)
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

  async logout(refreshToken: string): Promise<APIResponse> {
    const verifiedToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.refreshTokenRepository.update(
      { sessionId: verifiedToken.sessionId, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revocationReason: RevocationReason.LOGOUT,
      }
    );

    return {
      message: this.i18n.t(
        `${this.i18nAuthNamespace}` + `loggedOutSuccessfully`
      ),
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto, account: Account) {
    // Get the account password
    const { password } = (await this.accountsRepository.findOne({
      where: { id: account.id },
      select: ['password'],
    }))!;

    // Compare the given old password with the account actual password
    if (!password)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `noPasswordSet`)
      );

    if (!(await compareHash(changePasswordDto.oldPassword, password)))
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `incorrectPassword`)
      );

    // Update the account with the new password
    const hashedPassword = await hashCode(changePasswordDto.password);

    await this.accountsRepository.update(
      { id: account.id },
      { password: hashedPassword }
    );
    this.logger.log(`Password updated for account: ${account.id}`);

    // logout the user from all his active sessions
    await this.refreshTokenRepository.update(
      { accountId: account.id },
      {
        revokedAt: new Date(),
        revocationReason: RevocationReason.PASSWORD_CHANGE,
      }
    );
    this.logger.log(
      `All sessions revoked for account: ${account.id} after password change`
    );

    const result: APIResponse = {
      message: this.i18n.t(`${this.i18nAuthNamespace}` + `passwordChanged`),
    };

    return result;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    // find the account
    const account = await this.accountsRepository.findOneBy({
      email: forgotPasswordDto.email,
    });

    const result: APIResponse = {
      message: this.i18n.t(
        `${this.i18nAuthNamespace}` + `passwordResetCodeSent`
      ),
    };

    if (!account) {
      this.logger.warn(
        `No account found for forgot password: ${forgotPasswordDto.email}`
      );
      return result;
    }

    if (account.status === AccountStatus.PENDING)
      await this.sendCompleteProfileSetupResponse(
        account.id,
        true,
        this.i18n.t(`${this.i18nAuthNamespace}` + `completeProfileSetup`)
      );

    if (account.status === AccountStatus.INACTIVATED)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `verifyEmailToActivate`)
      );

    if (account.status === AccountStatus.DEACTIVATED)
      throw new ForbiddenException(
        this.i18n.t(
          `${this.i18nAuthNamespace}` + `accountDeactivatedReactivate`
        )
      );

    if (account.status === AccountStatus.SUSPENDED)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountSuspended`)
      );

    const otp = this.generateOTP();

    // send the email
    await this.emailService.sendPasswordResetEmail(
      forgotPasswordDto.email,
      otp,
      account.name
    );

    // update the account table
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() +
        this.configService.get<number>('VERIFICATION_OTP_EXPIRES_IN')!
    );

    const hashedOTP = await hashCode(otp);

    await this.accountsRepository.update(
      { id: account.id },
      { passwordResetCodeExpiresAt: expiresAt, passwordResetCode: hashedOTP }
    );

    return result;
  }

  async verifyResetPasswordToken(verifyOtpDto: VerifyOtpDto) {
    const account = await this.accountsRepository.findOne({
      where: { email: verifyOtpDto.email },
      select: ['id', 'passwordResetCode', 'passwordResetCodeExpiresAt'],
    });
    if (!account)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `noAccountFound`)
      );

    if (
      !account.passwordResetCode ||
      !account.passwordResetCodeExpiresAt ||
      new Date() > account.passwordResetCodeExpiresAt
    )
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `invalidPasswordResetCode`)
      );

    const isEqual = await compareHash(
      verifyOtpDto.verificationCode,
      account.passwordResetCode
    );
    if (!isEqual) {
      this.logger.warn(
        `Password reset code mismatch for email: ${verifyOtpDto.email}`
      );
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `invalidPasswordResetCode`)
      );
    }

    await this.accountsRepository.update(
      { id: account.id },
      { passwordResetCode: null, passwordResetCodeExpiresAt: null }
    );

    const token = await this.tokenService.generatePasswordResetToken({
      id: account.id,
    });

    const result: APIResponse = {
      passwordResetToken: token,
    };

    return result;
  }

  async resetPassword({ password, token }: ResetPasswordDto) {
    // Validate the token
    const verifiedToken =
      await this.tokenService.verifyPasswordResetToken(token);

    const accountExist = await this.accountsRepository.existsBy({
      id: verifiedToken.id,
    });
    if (!accountExist)
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `passwordResetTokenInvalid`)
      );

    // Update the account with the new password
    const hashedPassword = await hashCode(password);
    await this.accountsRepository.update(
      { id: verifiedToken.id },
      { password: hashedPassword }
    );
    this.logger.log(
      `Password updated for account: ${verifiedToken.id} - Reset Password Context`
    );

    // Logout the user from all his devices
    await this.refreshTokenRepository.update(
      { accountId: verifiedToken.id },
      {
        revokedAt: new Date(),
        revocationReason: RevocationReason.PASSWORD_RESET,
      }
    );
    this.logger.log(
      `All sessions revoked for account: ${verifiedToken.id} after password reset`
    );

    const result: APIResponse = {
      message: this.i18n.t(
        `${this.i18nAuthNamespace}` + `passwordResetSuccess`
      ),
    };

    return result;
  }

  async reactivateAndLogin(reactivationToken: string) {
    const verifiedToken =
      await this.tokenService.verifyReactivationToken(reactivationToken);

    const account = await this.accountsRepository.findOneBy({
      id: verifiedToken.id,
    });
    if (!account) {
      throw new NotFoundException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountNotFound`)
      );
    }

    if (account.status !== AccountStatus.DEACTIVATED) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountNotDeactivated`)
      );
    }

    account.status = AccountStatus.ACTIVATED;
    await this.accountsRepository.save(account);

    const accessToken = await this.tokenService.generateAccessToken({
      ...account,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      id: account.id,
      sessionId: uuidv4(),
    });

    const result: APIResponse = {
      message: this.i18n.t(`${this.i18nAuthNamespace}` + `accountReactivated`),
      data: account,
      accessToken,
      refreshToken,
    };

    return result;
  }

  async completeSetup(
    completeSetupDto: CompleteSetupDto
  ): Promise<APIResponse> {
    const verifiedSetupToken = await this.tokenService.verifySetupToken(
      completeSetupDto.setupToken
    );

    const { id } = verifiedSetupToken;

    const account = await this.accountsRepository.findOneBy({ id });
    if (!account)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nAuthNamespace}` + `accountNotFound`)
      );

    if (account.status !== AccountStatus.PENDING)
      throw new BadRequestException(
        this.i18n.t(
          `${this.i18nAuthNamespace}` + `profileSetupAlreadyCompleted`
        )
      );

    const { confirmPassword, setupToken, ...updateObject } = completeSetupDto;
    updateObject.password = await hashCode(updateObject.password);

    await this.accountsRepository.update(
      { id },
      {
        ...updateObject,
        status: AccountStatus.ACTIVATED,
      }
    );

    const updatedAccount = await this.accountsRepository.findOneBy({ id });

    const accessToken = await this.tokenService.generateAccessToken({
      ...updatedAccount,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      id,
      sessionId: uuidv4(),
    });

    this.searchService.createAccountDocument(updatedAccount!);
    return {
      message: this.i18n.t(
        `${this.i18nAuthNamespace}` + `profileSetupCompleted`
      ),
      data: updatedAccount!,
      accessToken,
      refreshToken,
    };
  }
}
