import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Hot Lead' })
  @IsString()
  @MaxLength(100)
  name: string;
  @ApiPropertyOptional({ example: '#EF4444' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
