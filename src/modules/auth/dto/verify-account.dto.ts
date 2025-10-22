import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class VerifyAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  verificationCode!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
