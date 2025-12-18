import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChamCongRaDto {
  @ApiPropertyOptional({
    description: 'ID bản ghi chấm công cần check-out. Nếu không truyền, hệ thống sẽ tự động tìm ca đang check-in.',
  })
  @IsOptional()
  @IsUUID()
  maChamCong?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú khi check-out',
  })
  @IsOptional()
  @IsString()
  ghiChu?: string;
}
