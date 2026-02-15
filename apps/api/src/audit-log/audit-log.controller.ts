import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { AuditLogQueryParams } from './audit-log.dto';
import { AuditLogService } from './audit-log.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Audit Log')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.AUDIT_LOG_READ)
  async findAll(
    @Query() query: AuditLogQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.auditLogService.findAll({ ...query, organizationId });
  }
}
