import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoaiCaLam } from '../../work-schedule/constants/work-schedule.constants';

export class ChamCongVaoDto {
  @ApiPropertyOptional({
    description: 'ID của ca làm việc cần check-in. Nếu không truyền, hệ thống sẽ tự động chọn ca phù hợp.',
  })
  @IsOptional()
  @IsUUID()
  maLichLam?: string;

  @ApiPropertyOptional({
    enum: LoaiCaLam,
    description: 'Loại ca cần check-in (morning/afternoon/custom). Dùng khi không biết ID lịch.',
  })
  @IsOptional()
  @IsEnum(LoaiCaLam)
  loaiCa?: LoaiCaLam;

  @ApiPropertyOptional({
    description: 'Vị trí GPS format "latitude,longitude"',
  })
  @IsOptional()
  @IsString()
  @Matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/, {
    message: 'Location must be in format "latitude,longitude"',
  })
  viTri?: string;

  @IsOptional()
  @IsString()
  ghiChu?: string;
}
