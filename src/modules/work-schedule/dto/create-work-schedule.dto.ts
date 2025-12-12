import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkType } from '../entities/work-schedule.entity';

export class ScheduleItemDto {
  @ApiProperty({ example: '2025-11-24' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: WorkType, example: WorkType.WFO })
  @IsEnum(WorkType)
  workType!: WorkType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateWorkScheduleDto {
  @ApiProperty({ description: 'Registration period ID' })
  @IsUUID()
  @IsNotEmpty()
  periodId!: string;

  @ApiProperty({ type: [ScheduleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedules!: ScheduleItemDto[];
}
