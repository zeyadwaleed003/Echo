import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  verificationCode!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
