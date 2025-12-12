import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveLeaveRequestDto {
  @ApiPropertyOptional({ description: 'Admin note for the request' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class RejectLeaveRequestDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;

  @ApiPropertyOptional({ description: 'Admin note for the request' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
