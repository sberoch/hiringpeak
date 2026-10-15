import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CurrentUser } from '../auth/auth.decorators';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import {
  ChangeOpportunityStageDto,
  CreateOpportunityDto,
  OpportunityQueryParams,
  UpdateOpportunityCloseDateDto,
  UpdateOpportunityDto,
} from './opportunity.dto';
import { OpportunityService } from './opportunity.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Opportunities')
@Controller('opportunity')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  private parseUserId(user: { id: string | number }): number {
    return typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(
    @Query() query: OpportunityQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'create_opportunity',
    entityType: 'opportunity',
    labelField: 'title',
    relatedFields: [{ type: 'company', field: 'company.name' }],
  })
  @Post()
  async create(
    @Body() createOpportunityDto: CreateOpportunityDto,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.opportunityService.create({
      ...createOpportunityDto,
      organizationId,
      createdBy: this.parseUserId(user),
    });
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'update_opportunity',
    entityType: 'opportunity',
    labelField: 'title',
    relatedFields: [{ type: 'company', field: 'company.name' }],
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityService.update(+id, {
      ...updateOpportunityDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'change_opportunity_stage',
    entityType: 'opportunity',
    labelField: 'title',
    relatedFields: [
      { type: 'stage_from', field: 'stageChange.from' },
      { type: 'stage_to', field: 'stageChange.to' },
      { type: 'close_date_from', field: 'closeChange.from' },
      { type: 'close_date_to', field: 'closeChange.to' },
      { type: 'lost_reason_from', field: 'lostReasonChange.from' },
      { type: 'lost_reason_to', field: 'lostReasonChange.to' },
    ],
  })
  @Post(':id/stage')
  async changeStage(
    @Param('id') id: string,
    @Body() changeStageDto: ChangeOpportunityStageDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityService.changeStage(
      +id,
      organizationId,
      changeStageDto,
    );
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'update_opportunity_close_date',
    entityType: 'opportunity',
    labelField: 'title',
    relatedFields: [
      { type: 'close_date_from', field: 'closeChange.from' },
      { type: 'close_date_to', field: 'closeChange.to' },
    ],
  })
  @Patch(':id/close-date')
  async updateCloseDate(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityCloseDateDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityService.updateCloseDate(
      +id,
      organizationId,
      dto.closeDate,
    );
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'delete_opportunity',
    entityType: 'opportunity',
    labelField: 'title',
    relatedFields: [{ type: 'company', field: 'company.name' }],
  })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.opportunityService.remove(+id, organizationId);
  }
}
