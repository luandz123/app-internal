import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
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
    description: 'Ghi chú khi check-in',
  })
  @IsOptional()
  @IsString()
  ghiChu?: string;
}
