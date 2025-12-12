import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to send notification to' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ example: 'Đơn nghỉ phép đã được duyệt' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Đơn nghỉ phép ngày 25/11/2025 của bạn đã được duyệt.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @ApiPropertyOptional({ description: 'Related entity type' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedType?: string;

  @ApiPropertyOptional({ description: 'Link to related resource' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  link?: string;
}

export class BroadcastNotificationDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ example: 'Cập nhật nội quy mới' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Nội quy công ty đã được cập nhật. Vui lòng xem lại.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'User IDs to send to (empty = all users)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  link?: string;
}
