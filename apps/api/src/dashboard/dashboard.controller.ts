import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { DashboardService } from './dashboard.service';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOkResponse()
  @UseGuards(OrganizationGuard)
  @Get()
  async getDashboard(@OrganizationId() organizationId: number) {
    return this.dashboardService.getDashboard(organizationId);
  }

  @ApiOkResponse()
  @UseGuards(OrganizationGuard)
  @Get('recruiter-stats')
  async getRecruiterStats(@OrganizationId() organizationId: number) {
    return this.dashboardService.getRecruiterStats(organizationId);
  }

  @ApiOkResponse()
  @UseGuards(PermissionsGuard, OrganizationGuard)
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get('commercial')
  async getCommercialSummary(@OrganizationId() organizationId: number) {
    return this.dashboardService.getCommercialSummary(organizationId);
  }
}
