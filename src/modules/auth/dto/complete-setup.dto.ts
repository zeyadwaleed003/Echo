import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';
import { Gender } from 'src/modules/accounts/accounts.enums';

export class CompleteSetupDtp {
  @IsString()
  @Length(8, 255)
  password!: string;

  @IsString()
  @Match('password')
  confirmPassword!: string;

  @IsDate()
  @Type(() => Date)
  birthDate!: Date;

  @IsEnum(Gender)
  gender!: Gender;

  @IsString()
  @Length(3, 50)
  @IsAlphanumeric()
  username!: string;

  @IsString()
  @IsNotEmpty()
  setupToken!: string;
}
