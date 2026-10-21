import { Inject, Injectable } from '@nestjs/common';
import type { UpdateBrandingLogoDto } from '@workspace/shared/dtos';
import { organizations } from '@workspace/shared/schemas';
import type { Branding } from '@workspace/shared/types/branding';
import { eq } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/** Who is acting on the Branding: their Organization and Permission codes. */
export type BrandingActor = {
  organizationId: number;
  userId: number;
  codes: readonly string[];
};

const BRANDING_COLUMNS = {
  logoUrl: organizations.logoUrl,
  originalLogoUrl: organizations.originalLogoUrl,
  accentColor: organizations.accentColor,
};

/** An Organization's Branding: read by any of its End Users. */
@Injectable()
export class BrandingService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async get(organizationId: number): Promise<Branding> {
    const [row] = await this.db
      .select(BRANDING_COLUMNS)
      .from(organizations)
      .where(eq(organizations.id, organizationId));
    return row;
  }

  /** Sets the Organization's logo (downscaled copy plus original). */
  async update(
    actor: BrandingActor,
    logo: UpdateBrandingLogoDto,
  ): Promise<Branding> {
    const [row] = await this.db
      .update(organizations)
      .set({
        logoUrl: logo.logoUrl,
        originalLogoUrl: logo.originalLogoUrl,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, actor.organizationId))
      .returning(BRANDING_COLUMNS);
    return row;
  }
}
