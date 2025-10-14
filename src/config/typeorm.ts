import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const typeOrmConfig = (
  configService: ConfigService
): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST')!,
  port: configService.get('DB_PORT')!,
  username: configService.get('DB_USERNAME')!,
  password: configService.get('DB_PASSWORD')!,
  database: configService.get('DB_NAME')!,
  entities: [],
  synchronize: configService.get('NODE_ENV')! === 'development', // Don't use in production
});
