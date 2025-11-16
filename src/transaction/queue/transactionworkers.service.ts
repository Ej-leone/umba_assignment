import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TransactionProcessor } from './transactionprocessor.service';

@Processor('transactions')
export class TransactionWorkers extends WorkerHost {
  constructor(private readonly transactionProcessor: TransactionProcessor) {
    super();
  }
  private readonly logger = new Logger(TransactionWorkers.name);
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug('Processing job');
    switch (job.name) {
      case 'step-initialize':
        this.logger.debug('Handling initialize job');
        return this.handleInitialize(job);
      case 'step-collect':
        return this.handleCollect(job);
      case 'step-disburse':
        return this.handleDisburse(job);
      case 'step-finalize':
        return this.handleFinalize(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async handleInitialize(job: Job) {
    await this.transactionProcessor.intialiseTransactionProcessing(job.data);
  }

  private async handleCollect(job: Job) {
    await this.transactionProcessor.intialisecollectionProcessing(job.data);
  }

  private async handleDisburse(job: Job) {
    await this.transactionProcessor.intialiseDisbursementProcessing(job.data);
  }

  private async handleFinalize(job: Job) {
    await this.transactionProcessor.stepFinalize(job.data);
  }
}
