import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Client } from '../../clients/entities/client.entity';
import { Property } from '../../properties/entities/property.entity';

export enum AppointmentType {
  SITE_VISIT = 'site_visit',
  MEETING = 'meeting',
  CALL = 'call',
}
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn() appointment_id: number;
  @Column() lead_id: number;
  @Column() agent_id: number;
  @Column() client_id: number;
  @Column() property_id: number;
  @Column({ type: 'timestamptz' }) scheduled_at: Date;
  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.SITE_VISIT,
  })
  type: AppointmentType;
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;
  @Column({ type: 'text', nullable: true }) notes: string;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => Lead, (l) => l.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;
  @ManyToOne(() => Agent, (a) => a.appointments)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;
  @ManyToOne(() => Client) @JoinColumn({ name: 'client_id' }) client: Client;
  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;
}
