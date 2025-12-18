import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChamCongRaDto {
  @ApiPropertyOptional({
    description: 'ID bản ghi chấm công cần check-out. Nếu không truyền, hệ thống sẽ tự động tìm ca đang check-in.',
  })
  @IsOptional()
  @IsUUID()
  maChamCong?: string;

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
