import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OnboardOrganizationSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export class OnboardOrganizationDto extends createZodDto(
  OnboardOrganizationSchema,
) {}
