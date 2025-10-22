import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration } from './config/configuration';
import { dataSourceOptions } from './database/data-source';
import { HealthModule } from './modules/health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { LikesModule } from './modules/likes/likes.module';
import { PostsModule } from './modules/posts/posts.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BlockedWordsModule } from './modules/blocked-words/blocked-words.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    HealthModule,
    AccountsModule,
    AuthModule,
    LikesModule,
    PostsModule,
    BookmarksModule,
    NotificationsModule,
    BlockedWordsModule,
  ],
})
export class AppModule {}
