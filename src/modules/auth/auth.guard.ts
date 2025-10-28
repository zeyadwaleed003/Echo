import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../token/token.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { IsNull, Repository } from 'typeorm';
import { AccountStatus } from '../accounts/accounts.enums';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromHeader(req);

    if (!accessToken)
      throw new UnauthorizedException('Access token is missing or invalid');

    try {
      // Verify the access token
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      // Verify if account available
      const account = await this.accountsRepository.findOne({
        where: { email: payload.email, id: payload.id },
        select: ['id', 'email', 'status', 'role'],
      });

      if (!account)
        throw new UnauthorizedException('Access token is invalid or expired');

      const { refreshToken } = req.cookies;
      if (!refreshToken)
        throw new UnauthorizedException('Refresh token is invalid or expired');

      const verifiedRefreshToken =
        await this.tokenService.verifyRefreshToken(refreshToken);

      const storedRefreshToken = await this.refreshTokenRepository.findOne({
        where: {
          sessionId: verifiedRefreshToken.sessionId,
          accountId: verifiedRefreshToken.id,
          revokedAt: IsNull(),
        },
      });

      if (!storedRefreshToken)
        throw new UnauthorizedException('Refresh token is invalid or expired');

      if (account.status === AccountStatus.SUSPENDED)
        throw new ForbiddenException(
          'Your account has been suspended. Please contact support for assistance'
        );

      if (account.status === AccountStatus.DEACTIVATED)
        throw new ForbiddenException(
          'Your account has been deactivated. Please contact support to reactivate'
        );

      if (account.status === AccountStatus.PENDING)
        throw new ForbiddenException(
          'Please complete your profile setup to access this resource'
        );

      req.account = payload;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      if (err instanceof UnauthorizedException) throw err;

      throw new UnauthorizedException('Access token is invalid or expired');
    }

    return true;
  }
}
