import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { TasksService } from './tasks.service';
import { Account } from '../accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, Account]),
    ScheduleModule.forRoot(),
  ],
  providers: [TasksService],
})
export class TasksModule {}
