import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PeriodType } from '../entities/registration-period.entity';

export class CreateRegistrationPeriodDto {
  @ApiProperty({ example: 'Week 48 - November 2025' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PeriodType, example: PeriodType.WEEKLY })
  @IsEnum(PeriodType)
  type!: PeriodType;

  @ApiProperty({ example: '2025-11-24' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-11-30' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: '2025-11-22T23:59:59Z' })
  @IsDateString()
  registrationDeadline!: string;
}
