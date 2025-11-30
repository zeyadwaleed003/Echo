import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class IdDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
