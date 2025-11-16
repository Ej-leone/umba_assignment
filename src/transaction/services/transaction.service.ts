import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTransactionDto,
  TransactionStatus,
} from '../dto/create-transaction.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { Repository } from 'typeorm';
import { Quote } from 'src/quote/quote.entity';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Transaction } from '../transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('transactions') private transactionQueue: Queue,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
  ) {}
  private readonly logger = new Logger(TransactionService.name);

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    idempotencyKey: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        id: idempotencyKey,
      },
    });
    if (transaction) {
      throw new HttpException(
        'Transaction already exists',
        HttpStatus.CONFLICT,
      );
    }

    //fetch quote from database
    const quote = await this.quoteRepository.findOne({
      where: {
        id: createTransactionDto.quoteId,
      },
    });
    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    //ensure quote is still valid
    if (quote.expiresAt < new Date()) {
      throw new HttpException('Quote expired', HttpStatus.CONFLICT);
    }

    // Additional checks based on quote payin method
    if (quote.payinMethod === 'mobile_money') {
      if (!createTransactionDto.mobilePhone) {
        throw new BadRequestException(
          'mobilePhone is required for mobile_money payin method',
        );
      }
    }

    if (quote.payinMethod === 'bank') {
      if (
        !createTransactionDto.bankAccountNumber ||
        !createTransactionDto.bank
      ) {
        throw new BadRequestException(
          'bankAccountNumber and bank are required for bank payin method',
        );
      }
    }

    await this.transactionQueue.add(
      'step-initialize',
      {
        quote: quote,
        idempotencyKey: idempotencyKey,
        ...createTransactionDto,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return plainToInstance(TransactionResponseDto, {
      id: idempotencyKey,
      transactionStatus: TransactionStatus.PENDING,
    });
  }
}
