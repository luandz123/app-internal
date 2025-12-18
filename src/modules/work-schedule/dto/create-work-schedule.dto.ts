import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  LoaiCaLam,
  LoaiHinhLamViec,
} from '../constants/work-schedule.constants';

export class ScheduleItemDto {
  @ApiProperty({ example: '2025-11-24' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: LoaiHinhLamViec, example: LoaiHinhLamViec.WFO })
  @IsEnum(LoaiHinhLamViec)
  workType!: LoaiHinhLamViec;

  @ApiProperty({
    enum: LoaiCaLam,
    example: LoaiCaLam.MORNING,
    description:
      'Loại ca: morning (sáng), afternoon (chiều), custom (tùy chỉnh)',
  })
  @IsEnum(LoaiCaLam)
  loaiCa!: LoaiCaLam;

  @ApiPropertyOptional({
    example: '08:30',
    description:
      'Giờ bắt đầu tùy chỉnh (bắt buộc với ca custom, tùy chọn với ca sáng/chiều để override)',
  })
  @ValidateIf((o) => o.loaiCa === LoaiCaLam.CUSTOM)
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:mm format',
  })
  gioBatDau?: string;

  @ApiPropertyOptional({
    example: '17:30',
    description:
      'Giờ kết thúc tùy chỉnh (bắt buộc với ca custom, tùy chọn với ca sáng/chiều để override)',
  })
  @ValidateIf((o) => o.loaiCa === LoaiCaLam.CUSTOM)
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:mm format',
  })
  gioKetThuc?: string;

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
