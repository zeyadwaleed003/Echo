import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { PostFiles } from './entities/post-file.entity';
import { Post } from './entities/post.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { AiModule } from '../ai/ai.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SearchModule } from '../search/search.module';
import { TokenModule } from '../token/token.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostFiles,
      Account,
      RefreshToken,
      AccountRelationships,
    ]),
    AiModule,
    TokenModule,
    CloudinaryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SearchModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
