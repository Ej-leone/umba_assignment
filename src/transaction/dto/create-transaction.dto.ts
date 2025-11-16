import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum TransactionStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  DISBURSED = 'disbursed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  quoteId: string;

  @IsString()
  @IsOptional()
  mobilePhone?: string;

  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @IsString()
  @IsOptional()
  bank?: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  transactionStatus?: TransactionStatus;
}

