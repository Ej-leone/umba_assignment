import { DataSource, DataSourceOptions } from 'typeorm';
import { Quote } from '../quote/quote.entity';
import { Transaction } from '../transaction/transaction.entity';

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
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Quote, Transaction],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.CA_CERTIFICATE,
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
