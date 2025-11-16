import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnprocessableEntityException,
  HttpException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { TransactionService } from './services/transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { IdempotencyKeyHeaderDto } from './dto/idempotency-key-header.dto';

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction from an existing quote' })
  @ApiHeader({
    name: 'x-idempotency-key',
    description: 'Idempotency key used to safely retry the request',
    required: true,
  })
  @ApiBody({ type: CreateTransactionDto })
  @ApiCreatedResponse({
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request body or missing/invalid x-idempotency-key header',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Quote is invalid or expired, or transaction cannot be created',
  })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    // Validate idempotency key header
    if (!idempotencyKey) {
      throw new BadRequestException(
        'x-idempotency-key header is required',
      );
    }

    // Validate idempotency key format using class-validator
    const idempotencyKeyDto = plainToInstance(
      IdempotencyKeyHeaderDto,
      { 'x-idempotency-key': idempotencyKey },
    );
    const validationErrors = await validate(idempotencyKeyDto);
    if (validationErrors.length > 0) {
      const messages = validationErrors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      throw new BadRequestException(
        `Invalid x-idempotency-key: ${messages.join(', ')}`,
      );
    }

    try {
      return await this.transactionService.createTransaction(
        createTransactionDto,
        idempotencyKey,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnprocessableEntityException(
        error.message || 'Failed to create transaction',
      );
    }
  }
}
