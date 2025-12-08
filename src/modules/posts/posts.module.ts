import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Account } from '../accounts/entities/account.entity';
import { Bookmark } from '../bookmarks/entities/bookmark.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { TokenModule } from '../token/token.module';
import { CloudinaryModule } from 'src/modules/cloudinary/cloudinary.module';
import { PostFiles } from './entities/post-file.entity';
import { Post } from './entities/post.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { RelationshipHelper } from 'src/common/helpers/relationship.helper';
import { SearchModule } from '../search/search.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Account,
      Bookmark,
      PostFiles,
      RefreshToken,
      AccountRelationships,
    ]),
    AiModule,
    TokenModule,
    CloudinaryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SearchModule),
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, RelationshipHelper],
  exports: [PostsService],
})
export class PostsModule {}
