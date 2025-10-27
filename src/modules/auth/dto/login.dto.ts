import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address or username used for login',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  emailOrUsername!: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
