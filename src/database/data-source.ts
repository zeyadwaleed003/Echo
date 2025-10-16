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
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
};

const dataSource = new DataSource(dataSourceOptions);

dataSource.initialize().then(() => {
  console.log(
    'Loaded entities:',
    dataSource.entityMetadatas.map((e) => e.name)
  );
  console.log(
    'Migrations:',
    dataSource.migrations.map((m) => m.name)
  );
});

export default dataSource;
