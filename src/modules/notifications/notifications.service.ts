import { FindManyOptions, Repository } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { HttpResponse, QueryString } from 'src/common/types/api.types';
import { I18nService } from 'nestjs-i18n';
import ApiFeatures from 'src/common/utils/ApiFeatures';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class NotificationsService {
  private readonly i18nNamespace = 'messages.notifications.';
  private readonly UNREAD_COUNT_PREFIX = 'unread_notifications';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService
  ) {}

  private async invalidateUnreadCountCache(accountId: number) {
    await this.redisService.del(`${this.UNREAD_COUNT_PREFIX}:${accountId}`);
  }

  async create(n: Partial<Notification>): Promise<HttpResponse> {
    const notification = this.notificationsRepository.create(n);
    await this.notificationsRepository.save(notification);

    this.invalidateUnreadCountCache(n.accountId!);

    return {
      message: this.i18n.t(`${this.i18nNamespace}notificationCreated`),
    };
  }

  async find(
    q: QueryString,
    queryOptions?: FindManyOptions<Notification>
  ): Promise<HttpResponse> {
    const notifications = await new ApiFeatures<Notification>(
      this.notificationsRepository,
      q,
      {
        ...queryOptions,
        relations: {
          account: true,
          actor: true,
          post: true,
        },
      }
    )
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .exec();

    return {
      size: notifications.length,
      data: notifications,
    };
  }

  async findCurrentAccountNotifications(accountId: number, q: QueryString) {
    const queryOptions: FindManyOptions<Notification> = {
      where: { accountId },
    };

    return await this.find(q, queryOptions);
  }

  async getUnreadCount(accountId: number): Promise<HttpResponse> {
    const cachedKey = `${this.UNREAD_COUNT_PREFIX}:${accountId}`;

    // Cache hit to get the number of unread notifications
    const cachedCount = await this.redisService.get<string>(cachedKey);
    if (cachedCount)
      return {
        unreadNotificationsNumber: +cachedCount,
      };

    // If not in the cache, get the number from the database
    const unreadNotificationsNumber =
      await this.notificationsRepository.countBy({ accountId, isRead: false });

    this.redisService.set<string>(cachedKey, String(unreadNotificationsNumber));

    return {
      unreadNotificationsNumber: unreadNotificationsNumber,
    };
  }

  async markAsRead(accountId: number, notificationId: number) {
    const notification = await this.notificationsRepository.findOneBy({
      id: notificationId,
    });

    if (!notification)
      throw new NotFoundException(
        this.i18n.t(`${this.i18nNamespace}notificationNotFound`)
      );

    if (notification.accountId !== accountId) {
      throw new ForbiddenException(
        this.i18n.t(`${this.i18nNamespace}notificationAccessDenied`)
      );
    }

    if (notification.isRead) {
      throw new BadRequestException(
        this.i18n.t(`${this.i18nNamespace}notificationAlreadyRead`)
      );
    }

    notification.isRead = true;
    await this.notificationsRepository.save(notification);

    // Invalidate cache
    this.invalidateUnreadCountCache(accountId);

    return {
      message: this.i18n.t(`${this.i18nNamespace}notificationMarkedAsRead`),
    };
  }

  async markAllAsRead(accountId: number): Promise<HttpResponse> {
    await this.notificationsRepository.update(
      { accountId, isRead: false },
      { isRead: true }
    );

    // Invalidate cache
    this.invalidateUnreadCountCache(accountId);

    return {
      message: this.i18n.t(`${this.i18nNamespace}allNotificationsMarkedAsRead`),
    };
  }
}
