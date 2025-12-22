import { createZodDto } from 'nestjs-zod';
import { LoginSchema } from '@workspace/shared/dtos';

export class LoginDto extends createZodDto(LoginSchema) {}
