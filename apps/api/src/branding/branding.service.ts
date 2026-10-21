import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PermissionCode } from '@workspace/shared/enums';
import { isBrandingStorageUrl } from '@workspace/shared/lib/branding-storage';
import type { UpdateBrandingLogoDto } from '@workspace/shared/dtos';
import { organizations } from '@workspace/shared/schemas';
import type { Branding } from '@workspace/shared/types/branding';
import { eq } from 'drizzle-orm';
import { AuditService } from '../audit-log/audit.service';
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

/**
 * An Organization's Branding: read by any of its End Users, changed only with
 * `ORGANIZATION_MANAGE`. Every change is recorded as an `update_branding`
 * Audit Event.
 */
@Injectable()
export class BrandingService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly audit: AuditService,
  ) {}

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
    const outside = [logo.logoUrl, logo.originalLogoUrl].some(
      (url) => !isBrandingStorageUrl(url, actor.organizationId),
    );
    if (outside) {
      throw new BadRequestException(
        'El logo debe estar guardado en el espacio de la organización',
      );
    }
    return this.write(actor, {
      logoUrl: logo.logoUrl,
      originalLogoUrl: logo.originalLogoUrl,
    });
  }

  /** Clears the logo: the sidebar goes back to HiringPeak's. */
  async removeLogo(actor: BrandingActor): Promise<Branding> {
    return this.write(actor, { logoUrl: null, originalLogoUrl: null });
  }

  private async write(
    actor: BrandingActor,
    fields: Partial<Branding>,
  ): Promise<Branding> {
    if (!actor.codes.includes(PermissionCode.ORGANIZATION_MANAGE)) {
      throw new ForbiddenException(
        'Solo un administrador puede cambiar el branding',
      );
    }
    const [row] = await this.db
      .update(organizations)
      .set({ ...fields, updatedAt: new Date() } as Partial<
        typeof organizations.$inferInsert
      >)
      .where(eq(organizations.id, actor.organizationId))
      .returning(BRANDING_COLUMNS);
    await this.audit.record({
      eventType: 'update_branding',
      entityType: 'organization',
      entityId: actor.organizationId,
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
    return row;
  }
}
