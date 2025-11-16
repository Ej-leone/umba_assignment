import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote } from './quote.entity';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { InjectRedis } from '@nestjs-redis/kit';
import { RedisClientType } from 'redis';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';

@Injectable()
export class QuoteService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRedis() private readonly redis: RedisClientType,
    private readonly configService: ConfigService,
  ) {
    const percentageFromEnv = this.configService.get<string>('PERCENTAGE_FEE');
    const rateExpiryTime = this.configService.get<string>('RATE_EXPIRY_TIME');

    this.feePercentage = new Decimal(percentageFromEnv);
    this.rateExpiryTimeMs = Number(rateExpiryTime ?? '600000'); // default 10 minutes
  }

  private readonly logger = new Logger(QuoteService.name);
  private readonly feePercentage: Decimal;
  private readonly rateExpiryTimeMs: number;

  async createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteResponseDto> {
    this.logger.debug({ createQuoteDto });

    // get rates and timestamp  from redis
    const rate = await this.redis.get(
      `rate:${createQuoteDto.currencyIn}/${createQuoteDto.currencyOut}:rate`,
    );
    const timestamp = await this.redis.get(
      `rate:${createQuoteDto.currencyIn}/${createQuoteDto.currencyOut}:timestamp`,
    );

    if (!rate || !timestamp) {
      throw new Error('Rate not found');
    }

   

    //calculate amounts using Decimal.js
    const amountDecimal = new Decimal(createQuoteDto.amount);
    const rateDecimal = new Decimal(rate as string);
    const convertedAmountDecimal = amountDecimal.mul(rateDecimal);
    const feeDecimal = convertedAmountDecimal.mul(this.feePercentage.div(100));

    const fee = feeDecimal.toNumber();
    const convertedAmount = convertedAmountDecimal.toNumber();

  

    //create quote and send result
    const quote = await this.quoteRepository.create({
      currencyIn: createQuoteDto.currencyIn,
      currencyOut: createQuoteDto.currencyOut,
      fee,
      amount: createQuoteDto.amount,
      payinMethod: createQuoteDto.payinMethod,
      payoutMethod: createQuoteDto.payoutMethod,
      expiresAt: new Date(Date.now() + 600000),
    });
    await this.quoteRepository.save(quote);

    this.logger.debug({ quote });

    return plainToInstance(
      QuoteResponseDto,
      { fee, convertedAmount, ...quote },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async checkRate(currencyIn: string, currencyOut: string): Promise<void> {
    const rate = await this.redis.get(`rate:${currencyIn}/${currencyOut}:rate`);
    const timestamp = await this.redis.get(
      `rate:${currencyIn}/${currencyOut}:timestamp`,
    );
    if (!rate || !timestamp) {
      throw new NotFoundException('Rate not found');
    }

    const rateTimestampSeconds = Number(timestamp);
    if (Number.isNaN(rateTimestampSeconds)) {
      throw new Error('Invalid rate timestamp');
    }

    const rateTimestampMs = rateTimestampSeconds * 1000;
    const now = Date.now();

    if (now - rateTimestampMs > this.rateExpiryTimeMs) {
      throw new Error('Rate expired');
    }
  }
}
