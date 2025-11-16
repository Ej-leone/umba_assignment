import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('quotes')
export class Quote {
  @Index()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'currency_in' })
  currencyIn: string;

  @Column({ name: 'currency_out' })
  currencyOut: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 18, scale: 2 })
  fee: number;


  @Index()
  @Column({ name: 'payin_method', nullable: true })
  payinMethod?: string;

  @Column({ name: 'payout_method', nullable: true })
  payoutMethod?: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    default: () => "CURRENT_TIMESTAMP + INTERVAL '60 seconds'",
  })
  expiresAt: Date;
}

