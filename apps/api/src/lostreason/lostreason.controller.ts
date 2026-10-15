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
import { CreateLostReasonDto, UpdateLostReasonDto } from './lostreason.dto';
import { LostReasonService } from './lostreason.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('LostReasons')
@Controller('lostReason')
export class LostReasonController {
  constructor(private readonly lostReasonService: LostReasonService) {}

  /** Lost Reasons ordered by sort, each with how many Opportunities carry it. */
  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(@OrganizationId() organizationId: number) {
    return this.lostReasonService.findAllWithUsage(organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'create_lost_reason',
    entityType: 'lost_reason',
    labelField: 'name',
  })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() dto: CreateLostReasonDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.lostReasonService.create(dto, organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'update_lost_reason',
    entityType: 'lost_reason',
    labelField: 'name',
  })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLostReasonDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.lostReasonService.update(+id, dto, organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'delete_lost_reason',
    entityType: 'lost_reason',
    labelField: 'name',
  })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.lostReasonService.remove(+id, organizationId);
  }
}
