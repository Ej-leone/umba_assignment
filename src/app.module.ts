import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuoteModule } from './quote/quote.module';
import { TransactionModule } from './transaction/transaction.module';
import { RatesModule } from './rates/rates.module';
import { validateEnv } from './env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './quote/quote.entity';
import { Transaction } from './transaction/transaction.entity';
import { RedisModule } from '@nestjs-redis/kit';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    RedisModule.forRoot({
      isGlobal: true,
      options: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue({
      name: 'transactions',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Quote, Transaction],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
        ca: process.env.CA_CERTIFICATE,
      },
    }),
    QuoteModule,
    TransactionModule,
    RatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'BULL_QUEUES',
      // expose existing BullMQ queues (currently: "transactions") for Bull Board
      useFactory: (transactionsQueue: Queue) => {
        return [transactionsQueue];
      },
      inject: [getQueueToken('transactions')],
    },
  ],
})
export class AppModule {}
