import { Expose } from 'class-transformer';

export class QuoteResponseDto {
  @Expose()
  id: string;

  @Expose()
  currencyIn: string;

  @Expose()
  currencyOut: string;

  @Expose()
  amount: number;

  @Expose()
  fee?: number;

  convertedAmount?: number;
  @Expose()
  payinMethod?: string;
  payoutMethod?: string;
}
