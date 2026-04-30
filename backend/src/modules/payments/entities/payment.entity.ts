import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Deal } from '../../deals/entities/deal.entity';

export enum PaymentType { FULL = 'full', INSTALLMENT = 'installment', DEPOSIT = 'deposit', COMMISSION = 'commission' }
export enum PaymentStatus { PENDING = 'pending', COMPLETED = 'completed', FAILED = 'failed', REFUNDED = 'refunded' }

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn() payment_id: number;
  @Column() deal_id: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: number;
  @Column({ type: 'enum', enum: PaymentType }) payment_type: PaymentType;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Column({ type: 'date', nullable: true }) payment_date: Date;
  @Column({ length: 100, nullable: true, unique: true }) reference_no: string;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @ManyToOne(() => Deal, (d) => d.payments) @JoinColumn({ name: 'deal_id' }) deal: Deal;
}
