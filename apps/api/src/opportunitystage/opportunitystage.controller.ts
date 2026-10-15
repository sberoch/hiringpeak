import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { OpportunityStageService } from './opportunitystage.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('OpportunityStages')
@Controller('opportunityStage')
export class OpportunityStageController {
  constructor(
    private readonly opportunityStageService: OpportunityStageService,
  ) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(@OrganizationId() organizationId: number) {
    return this.opportunityStageService.findAll(organizationId);
  }
}
