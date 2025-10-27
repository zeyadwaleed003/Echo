import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description:
      'Google ID token received from the client after authentication',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU2ZT...',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
