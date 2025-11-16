import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsISO4217CurrencyCode,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  @IsISO4217CurrencyCode()
  currencyIn: string;

  @IsString()
  @IsNotEmpty()
  @IsISO4217CurrencyCode()
  currencyOut: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(10)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  payinMethod?: string;

  @IsString()
  @IsOptional()
  payoutMethod?: string;
}

