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
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { RejectionReasonService } from './rejectionreason.service';
import {
  CreateRejectionReasonDto,
  UpdateRejectionReasonDto,
  RejectionReasonQueryParams,
} from './rejectionreason.dto';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('RejectionReasons')
@Controller('rejectionReason')
export class RejectionReasonController {
  constructor(
    private readonly rejectionReasonService: RejectionReasonService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: RejectionReasonQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.rejectionReasonService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.rejectionReasonService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'create_rejection_reason', entityType: 'rejection_reason', labelField: 'name' })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createRejectionReasonDto: CreateRejectionReasonDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.rejectionReasonService.create({
      ...createRejectionReasonDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'update_rejection_reason', entityType: 'rejection_reason', labelField: 'name' })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRejectionReasonDto: UpdateRejectionReasonDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.rejectionReasonService.update(+id, {
      ...updateRejectionReasonDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'delete_rejection_reason', entityType: 'rejection_reason', labelField: 'name' })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.rejectionReasonService.remove(+id, organizationId);
  }
}
