import { FindManyOptions, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { APIResponse, QueryString } from 'src/common/types/api.types';
import { I18nService } from 'nestjs-i18n';
import ApiFeatures from 'src/common/utils/ApiFeatures';

@Injectable()
export class NotificationsService {
  private readonly i18nNamespace = 'messages.notifications.';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly i18n: I18nService
  ) {}

  async create(n: Partial<Notification>): Promise<APIResponse> {
    const notification = this.notificationsRepository.create(n);
    await this.notificationsRepository.save(notification);

    return {
      message: this.i18n.t(`${this.i18nNamespace}notificationCreated`),
    };
  }

  async find(
    q: QueryString,
    queryOptions?: FindManyOptions<Notification>
  ): Promise<APIResponse> {
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
}
