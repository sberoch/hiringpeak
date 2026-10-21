import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import type { Branding } from '@workspace/shared/types/branding';
import { CurrentUser } from '../auth/auth.decorators';
import { AuthzService } from '../auth/authz/authz.service';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { UpdateBrandingLogoDto } from './branding.dto';
import { BrandingService, type BrandingActor } from './branding.service';

/**
 * The current Organization's Branding. Always scoped by the request's
 * Organization, never by a route id. The service records the Audit Event, so
 * these routes carry no `@AuditAction`.
 */
@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Branding')
@Controller('branding')
export class BrandingController {
  constructor(
    private readonly brandingService: BrandingService,
    private readonly authzService: AuthzService,
  ) {}

  private async actor(
    user: { id: string | number },
    organizationId: number,
  ): Promise<BrandingActor> {
    const userId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const codes = await this.authzService.getPermissionCodesForUser(userId);
    return { organizationId, userId, codes };
  }

  /** Open to any End User of the Organization: the sidebar needs the logo. */
  @ApiOkResponse()
  @Get()
  async get(@OrganizationId() organizationId: number): Promise<Branding> {
    return this.brandingService.get(organizationId);
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.ORGANIZATION_MANAGE)
  @Patch('logo')
  async updateLogo(
    @Body() dto: UpdateBrandingLogoDto,
    @CurrentUser() user: { id: string | number },
    @OrganizationId() organizationId: number,
  ): Promise<Branding> {
    return this.brandingService.update(
      await this.actor(user, organizationId),
      dto,
    );
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.ORGANIZATION_MANAGE)
  @Delete('logo')
  async removeLogo(
    @CurrentUser() user: { id: string | number },
    @OrganizationId() organizationId: number,
  ): Promise<Branding> {
    return this.brandingService.removeLogo(
      await this.actor(user, organizationId),
    );
  }
}
