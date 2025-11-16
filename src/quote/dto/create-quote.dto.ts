import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsISO4217CurrencyCode,
  Min,
  IsIn,
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
  @IsIn(['mobile_money', 'bank'])
  payinMethod?: string;

  @IsString()
  @IsOptional()
  @IsIn(['mobile_money', 'bank'])
  payoutMethod?: string;
}

