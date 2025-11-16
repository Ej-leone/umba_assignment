import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TransactionEventListener } from '../transactioneventlistener.service';
import { Queue, QueueEvents } from 'bullmq';

// Mock BullMQ QueueEvents so we can capture event handlers without a real Redis connection
jest.mock('bullmq', () => {
  class FakeQueue {}

  return {
    Queue: FakeQueue,
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

describe('TransactionEventListener queue flow', () => {
  let listener: TransactionEventListener;
  let mockQueue: { getJob: jest.Mock; add: jest.Mock };

  const getCompletedHandler = (): ((event: any) => Promise<void>) => {
    const queueEventsMock = QueueEvents as unknown as jest.Mock;
    const instance = queueEventsMock.mock.instances[0];
    const onMock = instance.on as jest.Mock;
    const completedCall = onMock.mock.calls.find(
      (call) => call[0] === 'completed',
    );
    return completedCall?.[1];
  };

  const getFailedHandler = (): ((event: any) => Promise<void>) => {
    const queueEventsMock = QueueEvents as unknown as jest.Mock;
    const instance = queueEventsMock.mock.instances[0];
    const onMock = instance.on as jest.Mock;
    const failedCall = onMock.mock.calls.find((call) => call[0] === 'failed');
    return failedCall?.[1];
  };

  beforeEach(async () => {
    mockQueue = {
      getJob: jest.fn(),
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionEventListener,
        {
          provide: getQueueToken('transactions'),
          useValue: mockQueue as unknown as Queue,
        },
      ],
    }).compile();

    listener = module.get(TransactionEventListener);
    expect(listener).toBeDefined();
  });

  it('step 1 fails: no follow-up jobs are enqueued', async () => {
    const failedHandler = getFailedHandler();
    expect(failedHandler).toBeDefined();

    await failedHandler!({
      jobId: 'init-123',
      failedReason: 'Some error',
    });

    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('step 1 passes, step 2 fails: only step-collect is enqueued', async () => {
    const completedHandler = getCompletedHandler();
    const failedHandler = getFailedHandler();
    expect(completedHandler).toBeDefined();
    expect(failedHandler).toBeDefined();

    // First completed event for step-initialize
    mockQueue.getJob.mockResolvedValueOnce({
      data: { idempotencyKey: 'abc' },
      returnvalue: { initResult: true },
    });

    await completedHandler!({ jobId: 'init-abc' });

    // Then step-collect job fails
    await failedHandler!({
      jobId: 'collect-abc',
      failedReason: 'Collect failed',
    });

    // Only step-collect should have been enqueued
    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'step-collect',
      expect.any(Object),
      expect.objectContaining({
        jobId: 'collect-abc',
      }),
    );
  });

  it('step 3 fails: step-collect and step-disburse enqueued, no step-finalize', async () => {
    const completedHandler = getCompletedHandler();
    const failedHandler = getFailedHandler();
    expect(completedHandler).toBeDefined();
    expect(failedHandler).toBeDefined();

    // step 1 (init) completes -> enqueue step-collect
    mockQueue.getJob
      .mockResolvedValueOnce({
        data: { idempotencyKey: 'abc' },
        returnvalue: { initResult: true },
      })
      // step 2 (collect) completes -> enqueue step-disburse
      .mockResolvedValueOnce({
        data: { transaction: { idempotencyKey: 'abc' } },
        returnvalue: { collectResult: true },
      });

    await completedHandler!({ jobId: 'init-abc' });
    await completedHandler!({ jobId: 'collect-abc' });

    // step 3 (disburse) fails
    await failedHandler!({
      jobId: 'disburse-abc',
      failedReason: 'Disburse failed',
    });

    // Two follow-up jobs should have been enqueued: collect, disburse
    expect(mockQueue.add).toHaveBeenCalledTimes(2);
    expect(mockQueue.add).toHaveBeenNthCalledWith(
      1,
      'step-collect',
      expect.any(Object),
      expect.objectContaining({
        jobId: 'collect-abc',
      }),
    );
    expect(mockQueue.add).toHaveBeenNthCalledWith(
      2,
      'step-disburse',
      expect.any(Object),
      expect.objectContaining({
        jobId: 'disburse-abc',
      }),
    );

    // No step-finalize should be scheduled when disburse fails
    expect(
      (mockQueue.add.mock.calls as unknown[][]).some(
        (call) => call[0] === 'step-finalize',
      ),
    ).toBe(false);
  });
}


