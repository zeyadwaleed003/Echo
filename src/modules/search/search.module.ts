import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { Post } from '../posts/entities/post.entity';
import { PostFiles } from '../posts/entities/post-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Post, PostFiles])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
