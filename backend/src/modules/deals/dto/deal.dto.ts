import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStatus } from '../entities/deal.entity';

export class CreateDealDto {
  @ApiProperty({ example: 5 }) @IsNumber() leadId: number;
  @ApiProperty({ example: 3 }) @IsNumber() propertyId: number;
  @ApiProperty({ example: 2 }) @IsNumber() agentId: number;
  @ApiProperty({ example: 1 }) @IsNumber() clientId: number;
  @ApiProperty({ example: 2350000 }) @IsNumber() @IsPositive() finalPrice: number;
  @ApiPropertyOptional({ example: '2025-08-20' }) @IsOptional() @IsDateString() dealDate?: string;
}

export class UpdateDealDto {
  @ApiPropertyOptional({ enum: DealStatus }) @IsOptional() @IsEnum(DealStatus) status?: DealStatus;
  @ApiPropertyOptional({ example: '2025-09-01' }) @IsOptional() @IsDateString() closingDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() finalPrice?: number;
}

export class DealFilterDto {
  @ApiPropertyOptional() @IsOptional() agentId?: string;
  @ApiPropertyOptional({ enum: DealStatus }) @IsOptional() @IsEnum(DealStatus) status?: DealStatus;
  @ApiPropertyOptional() @IsOptional() from?: string;
  @ApiPropertyOptional() @IsOptional() to?: string;
  @ApiPropertyOptional() @IsOptional() page?: string;
  @ApiPropertyOptional() @IsOptional() limit?: string;
}
