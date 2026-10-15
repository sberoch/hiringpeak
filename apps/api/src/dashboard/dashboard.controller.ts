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
  @Get()
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }

  @ApiOkResponse()
  @Get('recruiter-stats')
  async getRecruiterStats() {
    return this.dashboardService.getRecruiterStats();
  }

  @ApiOkResponse()
  @UseGuards(PermissionsGuard, OrganizationGuard)
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get('commercial')
  async getCommercialSummary(@OrganizationId() organizationId: number) {
    return this.dashboardService.getCommercialSummary(organizationId);
  }
}
