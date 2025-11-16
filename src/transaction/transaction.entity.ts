import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quote } from '../quote/quote.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quote)
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @Column({ name: 'payin_receipt', nullable: true })
  payinReceipt: string | null;

  @Column({ name: 'payout_receipt', nullable: true })
  payOutReceipt: string | null;

  @Column({ name: 'transaction_status' })
  transactionStatus: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
