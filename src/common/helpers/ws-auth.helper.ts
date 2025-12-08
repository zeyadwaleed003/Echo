import { Socket } from 'socket.io';
import { Repository, IsNull } from 'typeorm';
import { TokenService } from 'src/modules/token/token.service';
import { AccountStatus } from 'src/modules/accounts/accounts.enums';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';

export class WsAuthHelper {
  constructor(
    private readonly tokenService: TokenService,
    private readonly accountsRepository: Repository<Account>,
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  private extractTokenFromSocket(client: Socket): string | undefined {
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;

    if (!token) return undefined;

    if (typeof token === 'string' && token.startsWith('Bearer '))
      return token.split(' ')[1];

    return token;
  }

  private extractRefreshTokenFromSocket(client: Socket): string | undefined {
    // Try to extract from cookies
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      if (match) return match[1];
    }

    // Fallback to auth object
    return client.handshake.auth?.refreshToken;
  }

  async authenticate(
    client: Socket
  ): Promise<{ success: boolean; reason?: string }> {
    // Extract access token
    const accessToken = this.extractTokenFromSocket(client);
    if (!accessToken)
      return { success: false, reason: 'Access token is missing' };

    // Verify the access token
    let payload;
    try {
      payload = await this.tokenService.verifyAccessToken(accessToken);
    } catch {
      return { success: false, reason: 'Access token is invalid or expired' };
    }

    // Verify if account exists
    const account = await this.accountsRepository.findOne({
      where: { email: payload.email, id: payload.id },
    });

    if (!account) return { success: false, reason: 'Invalid access token' };

    // Extract refresh token
    const refreshToken = this.extractRefreshTokenFromSocket(client);
    if (!refreshToken)
      return { success: false, reason: 'Refresh token is missing' };

    // Verify refresh token
    let verifiedRefreshToken;
    try {
      verifiedRefreshToken =
        await this.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return { success: false, reason: 'Refresh token is invalid or expired' };
    }

    const storedRefreshToken = await this.refreshTokenRepository.findOne({
      where: {
        sessionId: verifiedRefreshToken.sessionId,
        accountId: verifiedRefreshToken.id,
        revokedAt: IsNull(),
      },
    });

    if (!storedRefreshToken)
      return { success: false, reason: 'Refresh token is invalid or expired' };

    // Check account status
    if (account.status === AccountStatus.SUSPENDED)
      return {
        success: false,
        reason:
          'Your account has been suspended. Please contact support for assistance',
      };

    if (account.status === AccountStatus.DEACTIVATED)
      return {
        success: false,
        reason:
          'Your account has been deactivated. Please contact support to reactivate',
      };

    if (account.status === AccountStatus.PENDING)
      return {
        success: false,
        reason: 'Please complete your profile setup to access this resource',
      };

    client.account = account;
    return { success: true };
  }
}
