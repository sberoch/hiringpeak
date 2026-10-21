import { createZodDto } from 'nestjs-zod';
import {
  UpdateBrandingAccentSchema,
  UpdateBrandingLogoSchema,
} from '@workspace/shared/dtos';

/** Request DTO: the Organization comes from the request context. */
export class UpdateBrandingLogoDto extends createZodDto(
  UpdateBrandingLogoSchema,
) {}

/** Request DTO: the Organization comes from the request context. */
export class UpdateBrandingAccentDto extends createZodDto(
  UpdateBrandingAccentSchema,
) {}
