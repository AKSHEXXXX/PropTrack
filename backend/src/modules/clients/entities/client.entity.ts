import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';

export enum ClientType {
  BUYER = 'buyer',
  SELLER = 'seller',
  RENTER = 'renter',
  LANDLORD = 'landlord',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  client_id: number;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: ClientType, default: ClientType.BUYER })
  client_type: ClientType;

  @Column({ length: 100, nullable: true })
  nationality: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Lead, (lead) => lead.client)
  leads: Lead[];
}
