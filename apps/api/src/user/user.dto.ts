import { createZodDto } from 'nestjs-zod';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
export class UserQueryParams extends createZodDto(UserQueryParamsSchema) {}
