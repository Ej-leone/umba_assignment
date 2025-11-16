import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { TransactionService } from './transaction.service';
import { Quote } from 'src/quote/quote.entity';
import {
  CreateTransactionDto,
  TransactionStatus,
} from '../dto/create-transaction.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

describe('TransactionService', () => {
  let service: TransactionService;
  let quoteRepository: jest.Mocked<Repository<Quote>>;
  let transactionQueue: { add: jest.Mock };

  beforeEach(async () => {
    quoteRepository = {
      findOne: jest.fn(),
    } as any;

    transactionQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Quote),
          useValue: quoteRepository,
        },
        {
          provide: getQueueToken('transactions'),
          useValue: transactionQueue as unknown as Queue,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a transaction for a valid quote and enqueues initialize step', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'quote-id',
      mobilePhone: '+254700000000',
    } as any;
    const idempotencyKey = 'idem-key';

    const futureDate = new Date(Date.now() + 60_000);
    const quote: Quote = {
      id: dto.quoteId,
      currencyIn: 'USD',
      currencyOut: 'KES',
      amount: 100,
      fee: 5,
      payinMethod: 'mobile_money',
      payoutMethod: 'mobile_money',
      createdAt: new Date(),
      expiresAt: futureDate,
    };

    quoteRepository.findOne.mockResolvedValue(quote);

    const result = await service.createTransaction(dto, idempotencyKey);

    expect(quoteRepository.findOne).toHaveBeenCalledWith({
      where: { id: dto.quoteId },
    });

    expect(transactionQueue.add).toHaveBeenCalledTimes(1);
    expect(transactionQueue.add).toHaveBeenCalledWith(
      'step-initialize',
      expect.objectContaining({
        quote,
        idempotencyKey,
      }),
      expect.objectContaining({
        attempts: 3,
        backoff: expect.objectContaining({
          type: 'exponential',
          delay: 2000,
        }),
        removeOnComplete: true,
        removeOnFail: false,
      }),
    );

    expect(result).toBeInstanceOf(TransactionResponseDto);
    expect(result.transactionStatus).toBe(TransactionStatus.PENDING);
    // Currently the service returns a static fee of 0 – validate this calculation
    expect(result.fee).toBe(0);
  });

  it('throws an error when the quote is not found', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'missing-quote-id',
    } as any;

    quoteRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createTransaction(dto, 'idem-key'),
    ).rejects.toThrowError('Quote not found');

    expect(transactionQueue.add).not.toHaveBeenCalled();
  });

  it('throws an error when the quote is expired', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'expired-quote-id',
    } as any;

    const pastDate = new Date(Date.now() - 60_000);
    const quote: Quote = {
      id: dto.quoteId,
      currencyIn: 'USD',
      currencyOut: 'KES',
      amount: 100,
      fee: 5,
      payinMethod: 'mobile_money',
      payoutMethod: 'mobile_money',
      createdAt: new Date(),
      expiresAt: pastDate,
    };

    quoteRepository.findOne.mockResolvedValue(quote);

    await expect(
      service.createTransaction(dto, 'idem-key'),
    ).rejects.toThrowError('Quote expired');

    expect(transactionQueue.add).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when payin method is mobile money and no mobile phone is provided', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'quote-id',
    } as any;
    const idempotencyKey = 'idem-key';

    const futureDate = new Date(Date.now() + 60_000);
    const quote: Quote = {
      id: dto.quoteId,
      currencyIn: 'USD',
      currencyOut: 'KES',
      amount: 100,
      fee: 5,
      payinMethod: 'mobile_money',
      payoutMethod: 'mobile_money',
      createdAt: new Date(),
      expiresAt: futureDate,
    };

    quoteRepository.findOne.mockResolvedValue(quote);

    await expect(
      service.createTransaction(dto, idempotencyKey),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transactionQueue.add).not.toHaveBeenCalled();
  });
});
