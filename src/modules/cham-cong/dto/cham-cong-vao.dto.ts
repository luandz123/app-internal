import { IsOptional, IsString, Matches } from 'class-validator';

export class ChamCongVaoDto {
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
