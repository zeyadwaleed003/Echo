import { IsNotEmpty, IsString } from 'class-validator';

export class ReactivationTokenDto {
  @IsString()
  @IsNotEmpty()
  reactivationToken!: string;
}
