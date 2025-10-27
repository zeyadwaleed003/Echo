import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token sent to the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'newStrongPassword123',
    minLength: 8,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'newStrongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword!: string;
}
