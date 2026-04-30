import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ClientType } from '../entities/client.entity';

export class CreateClientDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'sarah.j@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+971521234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ enum: ClientType, example: ClientType.BUYER })
  @IsEnum(ClientType)
  clientType: ClientType;

  @ApiPropertyOptional({ example: 'British' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class ClientFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ enum: ClientType })
  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;
}
