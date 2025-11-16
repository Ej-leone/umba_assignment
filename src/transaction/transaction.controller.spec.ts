import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './services/transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: jest.Mocked<TransactionService>;

  beforeEach(async () => {
    const transactionServiceMock: Partial<jest.Mocked<TransactionService>> = {
      createTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: transactionServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get(TransactionService) as jest.Mocked<TransactionService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw 400 if x-idempotency-key header is missing', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'quote-id',
      // adjust other required fields if added later
    } as any;

    await expect(
      controller.createTransaction(dto, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw 400 for invalid idempotency key (validation error)', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'quote-id',
    } as any;

    await expect(
      controller.createTransaction(dto, ''),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw 429 for expired quote (service error)', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'quote-id',
    } as any;

    (transactionService.createTransaction as jest.Mock).mockRejectedValue(
      new HttpException('Quote expired', HttpStatus.TOO_MANY_REQUESTS),
    );

    await expect(
      controller.createTransaction(dto, 'valid-idempotency-key'),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('should return 201 and transaction response for a valid quote', async () => {
    const dto: CreateTransactionDto = {
      quoteId: 'quote-id',
    } as any;

    const response: TransactionResponseDto = {
      id: 'tx-id',
      transactionStatus: TransactionStatus.PENDING,
      fee: 10,
    };

    (transactionService.createTransaction as jest.Mock).mockResolvedValue(
      response,
    );

    await expect(
      controller.createTransaction(dto, 'valid-idempotency-key'),
    ).resolves.toEqual(response);

    expect(transactionService.createTransaction).toHaveBeenCalledWith(
      dto,
      'valid-idempotency-key',
    );
  });
});
