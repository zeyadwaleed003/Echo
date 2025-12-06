import { IsUUID } from 'class-validator';

export class UuidDto {
  @IsUUID('4', { message: 'validation.id.isUuid' })
  id: string;
}
