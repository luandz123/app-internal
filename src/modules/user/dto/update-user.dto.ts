import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({ example: 'ada.lovelace@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Project Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;
}
