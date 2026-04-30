import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus, ContractType } from '../entities/contract.entity';

export class CreateContractDto {
  @ApiProperty({ example: 3 }) @IsNumber() dealId: number;
  @ApiPropertyOptional({ example: 'https://storage.proptrack.com/contracts/deal_3.pdf' }) @IsOptional() @IsString() documentUrl?: string;
  @ApiProperty({ enum: ContractType }) @IsEnum(ContractType) contractType: ContractType;
  @ApiPropertyOptional({ example: '2025-09-01' }) @IsOptional() @IsDateString() signedDate?: string;
  @ApiPropertyOptional({ example: '2026-09-01' }) @IsOptional() @IsDateString() expiryDate?: string;
}

export class UpdateContractDto {
  @ApiPropertyOptional({ enum: ContractStatus }) @IsOptional() @IsEnum(ContractStatus) status?: ContractStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() documentUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() signedDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}
