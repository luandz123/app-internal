import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SigninDto {
  @ApiProperty({ example: 'ada.lovelace@example.com' })
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  password!: string;
}
