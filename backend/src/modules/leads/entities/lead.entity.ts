import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Property } from '../../properties/entities/property.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Deal } from '../../deals/entities/deal.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  VISIT_SCHEDULED = 'visit_scheduled',
  OFFER_MADE = 'offer_made',
  DEAL_CLOSED = 'deal_closed',
  LOST = 'lost',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn() lead_id: number;
  @Column() client_id: number;
  @Column() property_id: number;
  @Column() agent_id: number;
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;
  @Column({ type: 'text', nullable: true }) notes: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budget: number;
  @Column({ default: false }) is_stale: boolean;
  @Column({ type: 'timestamptz', default: () => 'NOW()' }) inquiry_date: Date;
  @Column({ type: 'timestamptz', default: () => 'NOW()' }) last_activity: Date;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => Client, (c) => c.leads)
  @JoinColumn({ name: 'client_id' })
  client: Client;
  @ManyToOne(() => Property, (p) => p.leads)
  @JoinColumn({ name: 'property_id' })
  property: Property;
  @ManyToOne(() => Agent, (a) => a.leads)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;
  @ManyToMany(() => Tag, (tag) => tag.leads)
  @JoinTable({
    name: 'lead_tags',
    joinColumn: { name: 'lead_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Tag[];
  @OneToMany(() => Appointment, (apt) => apt.lead) appointments: Appointment[];
  @OneToMany(() => Deal, (deal) => deal.lead) deals: Deal[];
}
