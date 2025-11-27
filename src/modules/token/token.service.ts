import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { RefreshTokenPayload } from 'src/common/types/api.types';
import { InjectRepository } from '@nestjs/typeorm';
import { parseExpiresInMs } from 'src/common/utils/functions';
import { Account } from '../accounts/entities/account.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TokenService {
  private readonly i18nNamespace = 'messages.token';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateAccessToken(payload: object) {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    } as JwtSignOptions);
  }

  async generateRefreshToken(payload: RefreshTokenPayload) {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
    } as JwtSignOptions);

    const hashedToken = this.hashToken(token);

    const expiresAt = new Date(
      Date.now() +
        parseExpiresInMs(
          this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN')!
        )
    );

    const refreshToken = this.refreshTokenRepository.create({
      token: hashedToken,
      expiresAt,
      sessionId: payload.sessionId,
      accountId: payload.id,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async generatePasswordResetToken(payload: object) {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('PASSWORD_RESET_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>(
        'PASSWORD_RESET_TOKEN_EXPIRES_IN'
      ),
    } as JwtSignOptions);
  }

  async generateReactivationToken(payload: object) {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REACTIVATION_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>(
        'REACTIVATION_TOKEN_EXPIRES_IN'
      ),
    } as JwtSignOptions);
  }

  async generateSetupToken(payload: object) {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('SETUP_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('SETUP_TOKEN_EXPIRES_IN'),
    } as JwtSignOptions);
  }

  async verifySetupToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ id: number }>(token, {
        secret: this.configService.get<string>('SETUP_TOKEN_SECRET'),
      } as JwtVerifyOptions);
    } catch {
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nNamespace}.setupTokenInvalid`)
      );
    }
  }

  async verifyReactivationToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ id: number }>(token, {
        secret: this.configService.get<string>('REACTIVATION_TOKEN_SECRET'),
      } as JwtVerifyOptions);
    } catch {
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nNamespace}.reactivationTokenInvalid`)
      );
    }
  }

  async verifyAccessToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<Account>(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      } as JwtVerifyOptions);
    } catch {
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nNamespace}.accessTokenInvalid`)
      );
    }
  }

  async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      } as JwtVerifyOptions);
    } catch {
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nNamespace}.refreshTokenInvalid`)
      );
    }
  }

  async verifyPasswordResetToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ id: number }>(token, {
        secret: this.configService.get<string>('PASSWORD_RESET_TOKEN_SECRET'),
      } as JwtVerifyOptions);
    } catch {
      throw new UnauthorizedException(
        this.i18n.t(`${this.i18nNamespace}.passwordResetTokenInvalid`)
      );
    }
  }
}
