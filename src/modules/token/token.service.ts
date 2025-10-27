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

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  async verifyAccessToken(accessToken: string) {
    try {
      return await this.jwtService.verifyAsync<Account>(accessToken, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      } as JwtVerifyOptions);
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired');
    }
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        } as JwtVerifyOptions
      );
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }
}
