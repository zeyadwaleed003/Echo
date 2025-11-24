import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { Post } from '../posts/entities/post.entity';
import { PostFiles } from '../posts/entities/post-file.entity';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AccountRelationships } from '../accounts/entities/account-relationship.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Post,
      PostFiles,
      RefreshToken,
      AccountRelationships,
    ]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AppConfig, true>) => ({
        node: configService.get<string>('ELASTICSEARCH_NODE'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TokenModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
