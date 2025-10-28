import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The current password of the user',
    example: 'OldPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @ApiProperty({
    description: 'The new password',
    example: 'NewPassword456!',
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
    example: 'NewPassword456!',
  })
  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword!: string;
}
