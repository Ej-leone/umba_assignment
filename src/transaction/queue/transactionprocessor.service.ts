import { Injectable } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Transaction } from '../transaction.entity';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionStatus } from '../dto/create-transaction.dto';

@Injectable()
export class TransactionProcessor {
  constructor(
    private paymentService: PaymentService,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectQueue('transactions') private transactionQueue: Queue,

    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async intialiseTransactionProcessing(data: any): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const transaction = manager.create(Transaction, {
        id: data.idempotencyKey,
        quote: data.quote,
        transactionStatus: TransactionStatus.PENDING,
      });
      await manager.save(Transaction, transaction);
    });

    // Add to queue after transaction commits successfully
    await this.transactionQueue.add('step-collect', data);
  }

  async intialisecollectionProcessing(data: any): Promise<void> {
    const collectionResult =
      data.payinMethod === 'mobile_money'
        ? await this.paymentService.collectMobileMoneyPayment(
            data.mobilePhone,
            data.amount,
          )
        : await this.paymentService.collectBankPayment(
            data.bankAccountNumber,
            data.amount,
          );
    if (!collectionResult) {
      throw new Error('Failed to collect payment');
    }
    this.transactionRepository.update(data.idempotencyKey, {
      transactionStatus: TransactionStatus.COLLECTED,
      payinReceipt: collectionResult.receipt,
    });
    await this.transactionQueue.add('step-disburse', data);
  }

  async intialiseDisbursementProcessing(data: any): Promise<void> {
    const disbursementResult =
      data.payoutMethod === 'mobile_money'
        ? await this.paymentService.disburseMobileMoneyPayment(
            data.mobilePhone,
            data.amount,
          )
        : await this.paymentService.disburseBankPayment(
            data.bankAccountNumber,
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
