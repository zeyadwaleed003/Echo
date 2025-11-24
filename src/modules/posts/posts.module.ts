import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from '../ai/ai.module';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { PostsController } from './posts.controller';
import { PostFiles } from './entities/post-file.entity';
import { Account } from '../accounts/entities/account.entity';
import { Bookmark } from '../bookmarks/entities/bookmark.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { CloudinaryModule } from 'src/modules/cloudinary/cloudinary.module';
import { RelationshipHelper } from 'src/common/helpers/relationship.helper';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';

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
    AuthModule,
    TokenModule,
    CloudinaryModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, RelationshipHelper],
})
export class PostsModule {}
