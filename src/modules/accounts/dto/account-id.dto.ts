import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AccountIdDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;
}
