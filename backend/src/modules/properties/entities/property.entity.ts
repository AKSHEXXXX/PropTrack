import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { PropertyImage } from './property-image.entity';
import { Lead } from '../../leads/entities/lead.entity';

export enum PropertyType {
  APARTMENT = 'apartment', VILLA = 'villa', TOWNHOUSE = 'townhouse',
  OFFICE = 'office', RETAIL = 'retail', LAND = 'land',
}
export enum PropertyStatus {
  AVAILABLE = 'available', UNDER_NEGOTIATION = 'under_negotiation',
  SOLD = 'sold', RENTED = 'rented', OFF_MARKET = 'off_market',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn() property_id: number;
  @Column() agent_id: number;
  @Column({ length: 500 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ length: 500 }) location: string;
  @Column({ length: 100, default: 'Dubai' }) city: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) price: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) area_sqft: number;
  @Column({ type: 'enum', enum: PropertyType }) property_type: PropertyType;
  @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.AVAILABLE }) status: PropertyStatus;
  @Column({ type: 'smallint', nullable: true }) bedrooms: number;
  @Column({ type: 'smallint', nullable: true }) bathrooms: number;
  @Column({ type: 'date', nullable: true }) listed_at: Date;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => Agent, (agent) => agent.properties)
  @JoinColumn({ name: 'agent_id' }) agent: Agent;
  @OneToMany(() => PropertyImage, (img) => img.property, { cascade: true }) images: PropertyImage[];
  @OneToMany(() => Lead, (lead) => lead.property) leads: Lead[];
}
