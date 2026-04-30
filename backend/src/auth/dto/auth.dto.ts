import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'agent@proptrack.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'agent', enum: ['admin', 'manager', 'agent'] })
  @IsString()
  @IsIn(['admin', 'manager', 'agent'])
  role: string;
}

export class LoginDto {
  @ApiProperty({ example: 'agent@proptrack.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;
}
