import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuoteModule } from './quote/quote.module';
import { TransactionModule } from './transaction/transaction.module';
import { RatesModule } from './rates/rates.module';
import { validateEnv } from './env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-redis/kit';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { dataSourceOptions } from './databases/postgres-data-source';

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
    TypeOrmModule.forRoot(dataSourceOptions),
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
