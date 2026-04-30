import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AppointmentStatus,
  AppointmentType,
} from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ example: 5 }) @IsNumber() leadId: number;
  @ApiProperty({ example: 2 }) @IsNumber() agentId: number;
  @ApiProperty({ example: 1 }) @IsNumber() clientId: number;
  @ApiProperty({ example: 3 }) @IsNumber() propertyId: number;
  @ApiProperty({ example: '2025-08-15T10:00:00Z' })
  @IsDateString()
  scheduledAt: string;
  @ApiProperty({ enum: AppointmentType, example: AppointmentType.SITE_VISIT })
  @IsEnum(AppointmentType)
  type: AppointmentType;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class AppointmentFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() limit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agentId?: string;
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}
