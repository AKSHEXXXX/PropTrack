import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LeadStatus } from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({ example: 1 }) @IsNumber() clientId: number;
  @ApiProperty({ example: 3 }) @IsNumber() propertyId: number;
  @ApiProperty({ example: 2 }) @IsNumber() agentId: number;
  @ApiPropertyOptional({ example: 2200000 }) @IsOptional() @IsNumber() @IsPositive() budget?: number;
  @ApiPropertyOptional({ example: 'Client prefers high floor' }) @IsOptional() @IsString() notes?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ enum: LeadStatus }) @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() agentId?: number;
}

export class LeadFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() limit?: string;
  @ApiPropertyOptional({ enum: LeadStatus }) @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() agentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() isStale?: string;
}
