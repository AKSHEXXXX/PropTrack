import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Client } from '../../clients/entities/client.entity';
import { Property } from '../../properties/entities/property.entity';
import { Contract } from '../../contracts/entities/contract.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum DealStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn() deal_id: number;
  @Column() lead_id: number;
  @Column() property_id: number;
  @Column() agent_id: number;
  @Column() client_id: number;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) final_price: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  commission_amount: number;
  @Column({ type: 'enum', enum: DealStatus, default: DealStatus.PENDING })
  status: DealStatus;
  @Column({ type: 'date', nullable: true }) deal_date: Date;
  @Column({ type: 'date', nullable: true }) closing_date: Date;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => Lead, (l) => l.deals)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;
  @ManyToOne(() => Agent, (a) => a.deals)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;
  @ManyToOne(() => Client) @JoinColumn({ name: 'client_id' }) client: Client;
  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;
  @OneToMany(() => Contract, (c) => c.deal) contracts: Contract[];
  @OneToMany(() => Payment, (p) => p.deal) payments: Payment[];
}
