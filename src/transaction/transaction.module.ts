import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './transaction.controller';
import { Transaction } from './transaction.entity';
import { QuoteModule } from '../quote/quote.module';
import { PaymentService } from './services/payment.service';
import { BullModule } from '@nestjs/bullmq';
import { TransactionProcessor } from './queue/transactionprocessor.service';
import { TransactionEventListener } from './queue/transactioneventlistener.service';
import { TransactionWorkers } from './queue/transactionworkers.service';
import { Quote } from 'src/quote/quote.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transactions',
    }),
    TypeOrmModule.forFeature([Transaction, Quote]),
    QuoteModule,
  ],
  providers: [
    TransactionService,
    PaymentService,
    TransactionProcessor,
    TransactionEventListener,
    TransactionWorkers,
  ],
  controllers: [TransactionController],
  exports: [TransactionService, PaymentService],
})
export class TransactionModule {}
