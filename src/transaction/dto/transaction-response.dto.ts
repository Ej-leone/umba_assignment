import { TransactionStatus } from './create-transaction.dto';

export class TransactionResponseDto {
  id: string;
  transactionStatus: TransactionStatus;
  fee: number;
}
