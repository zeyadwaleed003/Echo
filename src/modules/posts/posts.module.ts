import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { TokenModule } from '../token/token.module';
import { CloudinaryModule } from 'src/modules/cloudinary/cloudinary.module';
import { PostFiles } from './entities/post-file.entity';
import { Post } from './entities/post.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { SearchModule } from '../search/search.module';

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
    AuthModule,
    TokenModule,
    CloudinaryModule,
    SearchModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
