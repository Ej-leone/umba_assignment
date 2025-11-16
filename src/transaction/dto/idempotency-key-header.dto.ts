import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class IdempotencyKeyHeaderDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  'x-idempotency-key': string;
}

