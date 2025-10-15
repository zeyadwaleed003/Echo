import { DataSource, DataSourceOptions } from 'typeorm';
import { configuration } from '../config/configuration';

const env = configuration();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [`${env.SOURCE_FOLDER}/modules/**/*.entity.ts`],
  migrations: [`${env.SOURCE_FOLDER}/database/migrations/*.ts`],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
