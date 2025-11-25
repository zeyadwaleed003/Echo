import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Like } from './entities/like.entity';
import { LikesService } from './likes.service';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { LikesController } from './likes.controller';
import { Post } from '../posts/entities/post.entity';
import { Account } from '../accounts/entities/account.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';
import { RelationshipHelper } from 'src/common/helpers/relationship.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Like,
      Post,
      Account,
      RefreshToken,
      AccountRelationships,
    ]),
    AuthModule,
    TokenModule,
  ],
  controllers: [LikesController],
  providers: [LikesService, RelationshipHelper],
})
export class LikesModule {}
