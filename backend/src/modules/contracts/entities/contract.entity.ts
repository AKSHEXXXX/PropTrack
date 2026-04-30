import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Deal } from '../../deals/entities/deal.entity';

export enum ContractType { SALE = 'sale', RENTAL = 'rental', MOU = 'mou', LISTING_AGREEMENT = 'listing_agreement' }
export enum ContractStatus { DRAFT = 'draft', SENT = 'sent', SIGNED = 'signed', EXPIRED = 'expired', CANCELLED = 'cancelled' }

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn() contract_id: number;
  @Column() deal_id: number;
  @Column({ length: 1000, nullable: true }) document_url: string;
  @Column({ type: 'enum', enum: ContractType }) contract_type: ContractType;
  @Column({ type: 'date', nullable: true }) signed_date: Date;
  @Column({ type: 'date', nullable: true }) expiry_date: Date;
  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT }) status: ContractStatus;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @ManyToOne(() => Deal, (d) => d.contracts, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'deal_id' }) deal: Deal;
}
