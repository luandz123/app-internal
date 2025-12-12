import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  PeriodType,
  RegistrationPeriodStatus,
} from '../entities/registration-period.entity';

export class UpdateRegistrationPeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: PeriodType })
  @IsOptional()
  @IsEnum(PeriodType)
  type?: PeriodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ enum: RegistrationPeriodStatus })
  @IsOptional()
  @IsEnum(RegistrationPeriodStatus)
  status?: RegistrationPeriodStatus;
}
