import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TrangThaiChamCong } from '../entities/cham-cong.entity';

export class TruyVanChamCongDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by user ID (admin only)' })
  @IsOptional()
  @IsUUID()
  maNguoiDung?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  ngayBatDau?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  ngayKetThuc?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TrangThaiChamCong,
  })
  @IsOptional()
  @IsEnum(TrangThaiChamCong)
  trangThai?: TrangThaiChamCong;

  @ApiPropertyOptional({ description: 'Filter by month (1-12)' })
  @IsOptional()
  @Type(() => Number)
  thang?: number;

  @ApiPropertyOptional({ description: 'Filter by year' })
  @IsOptional()
  @Type(() => Number)
  nam?: number;
}
