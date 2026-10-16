import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import {
  CreateOpportunityStageDto,
  SetOpportunityStageOutcomeDto,
  UpdateOpportunityStageDto,
} from './opportunitystage.dto';
import { OpportunityStageService } from './opportunitystage.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('OpportunityStages')
@Controller('opportunityStage')
export class OpportunityStageController {
  constructor(
    private readonly opportunityStageService: OpportunityStageService,
  ) {}

  /** Stages ordered by sort, each with how many Opportunities sit in it. */
  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(@OrganizationId() organizationId: number) {
    return this.opportunityStageService.findAllWithUsage(organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'create_opportunity_stage',
    entityType: 'opportunity_stage',
    labelField: 'name',
  })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() dto: CreateOpportunityStageDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityStageService.create(dto, organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'update_opportunity_stage',
    entityType: 'opportunity_stage',
    labelField: 'name',
  })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityStageDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityStageService.update(+id, dto, organizationId);
  }

  /** Makes this stage the won or the lost one. */
  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'set_opportunity_stage_outcome',
    entityType: 'opportunity_stage',
    labelField: 'name',
    relatedFields: [
      { type: 'outcome', field: 'outcomeChange.outcome' },
      { type: 'previous_opportunity_stage', field: 'outcomeChange.from' },
    ],
  })
  @ApiOkResponse()
  @Patch(':id/outcome')
  async setOutcome(
    @Param('id') id: string,
    @Body() dto: SetOpportunityStageOutcomeDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityStageService.setOutcome(+id, dto, organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'delete_opportunity_stage',
    entityType: 'opportunity_stage',
    labelField: 'name',
  })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityStageService.remove(+id, organizationId);
  }
}
