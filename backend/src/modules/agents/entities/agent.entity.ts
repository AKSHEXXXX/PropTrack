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
import { Agency } from '../../agencies/entities/agency.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Deal } from '../../deals/entities/deal.entity';
import { Property } from '../../properties/entities/property.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn()
  agent_id: number;

  @Column()
  agency_id: number;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.025 })
  commission_rate: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'date', nullable: true })
  joined_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Agency, (agency) => agency.agents)
  @JoinColumn({ name: 'agency_id' })
  agency: Agency;

  @OneToMany(() => Lead, (lead) => lead.agent)
  leads: Lead[];

  @OneToMany(() => Deal, (deal) => deal.agent)
  deals: Deal[];

  @OneToMany(() => Property, (property) => property.agent)
  properties: Property[];

  @OneToMany(() => Appointment, (appointment) => appointment.agent)
  appointments: Appointment[];
}
