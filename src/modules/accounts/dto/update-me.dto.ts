import { OmitType } from '@nestjs/mapped-types';
import { UpdateAccountAdminDto } from './update-account-admin.dto';

export class UpdateMeDto extends OmitType(UpdateAccountAdminDto, [
  'password',
]) {}
