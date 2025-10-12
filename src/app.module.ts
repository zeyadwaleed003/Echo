import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import validate from './config/validate';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate,
    }),
  ],
})
export class AppModule {}
