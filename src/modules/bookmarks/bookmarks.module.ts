import { Module } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { Post } from '../posts/entities/post.entity';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { Account } from '../accounts/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Bookmark } from './entities/bookmark.entity';
import { PostFiles } from '../posts/entities/post-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Account,
      RefreshToken,
      AccountRelationships,
      Bookmark,
      PostFiles,
    ]),
    AuthModule,
    TokenModule,
  ],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
