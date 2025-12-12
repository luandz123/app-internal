import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { LeaveRequestType } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  @ApiProperty({
    enum: LeaveRequestType,
    example: LeaveRequestType.ANNUAL_LEAVE,
  })
  @IsEnum(LeaveRequestType)
  type!: LeaveRequestType;

  @ApiProperty({ example: '2025-11-25' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-11-26' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Total days (can be 0.5 for half day)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  totalDays?: number;

  @ApiProperty({ example: 'Family emergency' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of attachment file paths',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
