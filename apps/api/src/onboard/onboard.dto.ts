import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { passwordSchema } from '@workspace/shared/lib/password.schema';

export const OnboardOrganizationSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  email: z.email('Invalid email'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
});

export class OnboardOrganizationDto extends createZodDto(
  OnboardOrganizationSchema,
) {}
