import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';

@Injectable()
export class TransactionEventListener {
  constructor(@InjectQueue('transactions') private transactionQueue: Queue) {
    this.setupEventListeners();
  }
  private readonly logger = new Logger(TransactionEventListener.name);
  private setupEventListeners() {
    const queueEvents = new QueueEvents('transactions');

    // When step-initialize completes, add step-collect
    queueEvents.on('completed', async (event) => {
      this.logger.debug('Transaction completed event');
      if (event.jobId?.startsWith('init-')) {
        const job = await this.transactionQueue.getJob(event.jobId);
        if (job) {
          const result = job.returnvalue;
          await this.transactionQueue.add(
            'step-collect',
            {
              transaction: job.data,
              previousResult: result,
            },
            {
              jobId: `collect-${job.data.idempotencyKey}`,
              attempts: 2,
              backoff: { type: 'exponential', delay: 2000 },
            },
          );
        }
      }

      // When step-collect completes, add step-disburse
      if (event.jobId?.startsWith('collect-')) {
        const job = await this.transactionQueue.getJob(event.jobId);
        if (job) {
          const result = job.returnvalue;
          await this.transactionQueue.add(
            'step-disburse',
            {
              transaction: job.data.transaction,
              previousResult: result,
            },
            {
              jobId: `disburse-${job.data.transaction.idempotencyKey}`,
              attempts: 2,
              backoff: { type: 'exponential', delay: 2000 },
            },
          );
        }
      }

      // When step-disburse completes, add step-finalize
      if (event.jobId?.startsWith('disburse-')) {
        const job = await this.transactionQueue.getJob(event.jobId);
        if (job) {
          const result = job.returnvalue;
          await this.transactionQueue.add(
            'step-finalize',
            {
              transaction: job.data.transaction,
              previousResult: result,
            },
            {
              jobId: `finalize-${job.data.transaction.idempotencyKey}`,
              attempts: 1,
            },
          );
        }
      }
    });

    // Handle failures at any step
    queueEvents.on('failed', async (event) => {
      this.logger.debug('Transaction Failed event');
      console.error(
        `Job failed: ${event.jobId}, reason: ${event.failedReason}`,
      );
      // Update transaction status to failed
    });
  }
}
