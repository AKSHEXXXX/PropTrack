import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn()
  agency_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, unique: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Agent, (agent) => agent.agency)
  agents: Agent[];
}
