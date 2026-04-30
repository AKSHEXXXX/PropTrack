import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DealStatus } from '../../modules/deals/entities/deal.entity';

@Entity('deal_audit_log')
export class DealAuditLog {
  @PrimaryGeneratedColumn()
  log_id: number;

  @Column()
  deal_id: number;

  @Column({ type: 'enum', enum: DealStatus, nullable: true })
  old_status: DealStatus | null;

  @Column({ type: 'enum', enum: DealStatus })
  new_status: DealStatus;

  @Column({ length: 255, nullable: true })
  changed_by: string | null;

  @CreateDateColumn()
  changed_at: Date;
}
