import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import {
  LoaiCaLam,
  LoaiHinhLamViec,
} from '../constants/work-schedule.constants';

export class UpdateWorkScheduleDto {
  @ApiPropertyOptional({ enum: LoaiHinhLamViec })
  @IsOptional()
  @IsEnum(LoaiHinhLamViec)
  workType?: LoaiHinhLamViec;

  @ApiPropertyOptional({ enum: LoaiCaLam })
  @IsOptional()
  @IsEnum(LoaiCaLam)
  loaiCa?: LoaiCaLam;

  @ApiPropertyOptional({
    description:
      'Giờ bắt đầu tùy chỉnh (có thể dùng cho ca sáng/chiều để override mặc định)',
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  gioBatDau?: string;

  @ApiPropertyOptional({
    description:
      'Giờ kết thúc tùy chỉnh (có thể dùng cho ca sáng/chiều để override mặc định)',
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  gioKetThuc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
