import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateSalaryDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 11 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional({ example: 2000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowance?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimePay?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number;

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insurance?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @IsInt()
  @Min(0)
  workDays?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualWorkDays?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leaveDays?: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
