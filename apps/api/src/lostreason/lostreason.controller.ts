import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { LostReasonService } from './lostreason.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('LostReasons')
@Controller('lostReason')
export class LostReasonController {
  constructor(private readonly lostReasonService: LostReasonService) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(@OrganizationId() organizationId: number) {
    return this.lostReasonService.findAll(organizationId);
  }
}
