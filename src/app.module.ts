import path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AiModule } from './modules/ai/ai.module';
import { configuration } from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { dataSourceOptions } from './database/data-source';
import { LikesModule } from './modules/likes/likes.module';
import { PostsModule } from './modules/posts/posts.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HealthModule } from './modules/health/health.module';
import { SearchModule } from './modules/search/search.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { BlockedWordsModule } from './modules/blocked-words/blocked-words.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        stores: [
          createKeyv(
            `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`
          ),
        ],
      }),
    }),
    HealthModule,
    AccountsModule,
    AuthModule,
    LikesModule,
    PostsModule,
    BookmarksModule,
    NotificationsModule,
    BlockedWordsModule,
    TasksModule,
    CloudinaryModule,
    AiModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
