import { DataSource, DataSourceOptions } from 'typeorm';
import { Quote } from './quote/quote.entity';
import { Transaction } from './transaction/transaction.entity';

// Try to load dotenv if available (for CLI usage)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { config } = require('dotenv');
  config();
} catch (e) {
  // dotenv not installed, environment variables should be set manually
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(
    process.env.DATABASE_PORT || process.env.DB_PORT || '5432',
    10,
  ),
  username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'root',
  password:
    process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'test',
  entities: [Quote, Transaction],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

