import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Account } from '../../modules/accounts/entities/account.entity';
import { RefreshToken } from '../../modules/auth/entities/refresh-token.entity';
import { RedisService } from '../../modules/redis/redis.service';
import { TokenService } from '../../modules/token/token.service';
import { WsAuthHelper } from '../helpers/ws-auth.helper';
import { AccountStatus } from '../../modules/messages/messages.types';

export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly wsAuthHelper: WsAuthHelper;
  protected abstract readonly logger: Logger;
  protected readonly REDIS_KEYS = {
    accountStatus: (accountId: number) => `account:${accountId}`,
    accountSockets: (accountId: number) => `account:${accountId}:sockets`,
  };

  constructor(
    protected readonly redisService: RedisService,
    tokenService: TokenService,
    accountsRepository: Repository<Account>,
    refreshTokenRepository: Repository<RefreshToken>
  ) {
    this.wsAuthHelper = new WsAuthHelper(
      tokenService,
      accountsRepository,
      refreshTokenRepository
    );
  }

  protected async handleAuth(client: Socket) {
    const isAuth = await this.wsAuthHelper.authenticate(client);

    if (!isAuth.success) {
      this.logger.warn(
        `Client connection rejected: ${client.id}, reason: ${isAuth.reason}`
      );

      client.emit('error', { reason: isAuth.reason });
      return;
    }

    client.emit('authenticated', { accountId: client.account!.id });
  }

  async handleConnection(client: Socket) {
    await this.handleAuth(client);

    this.logger.log(`Client connected: ${client.id}`);

    const accountId = client.account!.id;
    await this.redisService.set<AccountStatus>(
      this.REDIS_KEYS.accountStatus(accountId),
      {
        online: true,
        lastSeen: Date.now(),
      }
    );

    await this.redisService.sadd(
      this.REDIS_KEYS.accountSockets(accountId),
      client.id
    );
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    if (client.account) {
      const accountId = client.account.id;

      await this.redisService.srem(
        this.REDIS_KEYS.accountSockets(accountId),
        client.id
      );

      const socketsLeft = await this.redisService.scard(
        this.REDIS_KEYS.accountSockets(accountId)
      );
      if (!socketsLeft) {
        await this.redisService.set<AccountStatus>(
          this.REDIS_KEYS.accountStatus(accountId),
          {
            online: false,
            lastSeen: Date.now(),
          }
        );
      }
    }
  }
}
