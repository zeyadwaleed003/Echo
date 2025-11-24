import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { TasksService } from './tasks.service';
import { Account } from '../accounts/entities/account.entity';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, Account]),
    ScheduleModule.forRoot(),
    SearchModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
