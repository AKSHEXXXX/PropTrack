import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('property_images')
export class PropertyImage {
  @PrimaryGeneratedColumn() image_id: number;
  @Column() property_id: number;
  @Column({ length: 1000 }) image_url: string;
  @Column({ default: false }) is_primary: boolean;
  @CreateDateColumn() created_at: Date;
  @ManyToOne(() => Property, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;
}
