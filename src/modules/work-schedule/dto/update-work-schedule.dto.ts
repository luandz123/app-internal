import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkType } from '../entities/work-schedule.entity';

export class UpdateWorkScheduleDto {
  @ApiPropertyOptional({ enum: WorkType })
  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
