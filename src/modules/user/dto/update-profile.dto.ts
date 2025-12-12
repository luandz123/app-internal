import { PickType } from '@nestjs/mapped-types';
import { UpdateUserDto } from './update-user.dto';

export class UpdateProfileDto extends PickType(UpdateUserDto, [
  'firstName',
  'lastName',
  'phone',
  'address',
] as const) {}
