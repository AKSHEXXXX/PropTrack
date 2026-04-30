import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  agencyId: number;

  @ApiProperty({ example: 'Mohammed' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Al Rashid' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'm.rashid@dubairealty.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+971509876543' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 0.025, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;
}

export class UpdateAgentDto extends PartialType(CreateAgentDto) {}
