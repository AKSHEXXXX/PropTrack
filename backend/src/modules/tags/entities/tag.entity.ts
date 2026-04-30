import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn() tag_id: number;
  @Column({ length: 100, unique: true }) name: string;
  @Column({ length: 7, default: '#6B7280' }) color: string;
  @ManyToMany(() => Lead, (lead) => lead.tags) leads: Lead[];
}
