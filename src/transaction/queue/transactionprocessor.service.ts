import { Injectable } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Transaction } from '../transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionStatus } from '../dto/create-transaction.dto';

@Injectable()
export class TransactionProcessor {
  constructor(
    private paymentService: PaymentService,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectQueue('transactions') private transactionQueue: Queue,
  ) {}

  async intialiseTransactionProcessing(data: any): Promise<void> {
    try {
      const transaction = await this.transactionRepository.create({
        id: data.idempotencyKey,
        quote: data.quote,
        transactionStatus: TransactionStatus.PENDING,
      });
      await this.transactionRepository.save(transaction);
      await this.transactionQueue.add('step-collect', data);
    } catch (error) {
      console.error('error intialising transaction processing');
      console.error(error);
      throw error;
    }
  }

  async intialisecollectionProcessing(data: any): Promise<void> {
    const collectionResult =
      await this.paymentService.collectMobileMoneyPayment(
        '1234567890',
        data.amount,
      );
    this.transactionRepository.update(data.idempotencyKey, {
      transactionStatus: TransactionStatus.COLLECTED,
      payinReceipt: collectionResult.receipt,
    });
    await this.transactionQueue.add('step-disburse', data);
  }

  async intialiseDisbursementProcessing(data: any): Promise<void> {
    const disbursementResult =
      await this.paymentService.disburseMobileMoneyPayment(
        '1234567890',
        data.amount,
      );
    this.transactionRepository.update(data.idempotencyKey, {
      transactionStatus: TransactionStatus.DISBURSED,
      payOutReceipt: disbursementResult.receipt,
    });
    await this.transactionQueue.add('step-finalize', data);
  }

  async stepFinalize(data: any): Promise<void> {
    // something to be done

    console.debug(
      'starting finalize processing: sending notification to the user',
    );
    //TODO: send notification to the user
  }
}
