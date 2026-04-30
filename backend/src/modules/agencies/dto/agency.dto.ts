import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Dubai Realty Group' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Downtown Dubai, UAE' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '+971501234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'info@dubairealty.com' })
  @IsEmail()
  email: string;
}

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {}
