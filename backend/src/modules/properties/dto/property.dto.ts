import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUrl, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PropertyStatus, PropertyType } from '../entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty({ example: 1 }) @IsNumber() agentId: number;
  @ApiProperty({ example: 'Luxury 2BR Apartment - Downtown Dubai' }) @IsString() @MaxLength(500) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: 'Sheikh Mohammed Bin Rashid Blvd' }) @IsString() @MaxLength(500) location: string;
  @ApiPropertyOptional({ example: 'Dubai' }) @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiProperty({ example: 2500000 }) @IsNumber() @IsPositive() price: number;
  @ApiPropertyOptional({ example: 1200 }) @IsOptional() @IsNumber() @IsPositive() areaSqft?: number;
  @ApiProperty({ enum: PropertyType }) @IsEnum(PropertyType) propertyType: PropertyType;
  @ApiPropertyOptional({ enum: PropertyStatus }) @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsNumber() @Min(0) bedrooms?: number;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsNumber() @Min(0) bathrooms?: number;
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}

export class PropertyFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() limit?: string;
  @ApiPropertyOptional({ enum: PropertyType }) @IsOptional() @IsEnum(PropertyType) propertyType?: PropertyType;
  @ApiPropertyOptional({ enum: PropertyStatus }) @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => parseFloat(value)) @IsNumber() minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => parseFloat(value)) @IsNumber() maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => parseInt(value, 10)) @IsNumber() minBedrooms?: number;
}

export class AddImageDto {
  @ApiProperty({ example: 'https://storage.proptrack.com/img/1.jpg' }) @IsString() imageUrl: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() isPrimary?: boolean;
}
