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
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import {
  ContactSourceQueryParams,
  CreateContactSourceDto,
  UpdateContactSourceDto,
} from './contactsource.dto';
import { ContactSourceService } from './contactsource.service';

/**
 * Contact Sources ("Orígenes de contacto"): the network is commercial-only, so
 * reading needs commercial access and managing needs CRM_MANAGE.
 */
@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('ContactSources')
@Controller('contactSource')
export class ContactSourceController {
  constructor(private readonly contactSourceService: ContactSourceService) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(
    @Query() query: ContactSourceQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactSourceService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactSourceService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'create_contact_source',
    entityType: 'contact_source',
    labelField: 'name',
  })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() dto: CreateContactSourceDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactSourceService.create({ ...dto, organizationId });
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'update_contact_source',
    entityType: 'contact_source',
    labelField: 'name',
  })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactSourceDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactSourceService.update(+id, { ...dto, organizationId });
  }

  @Permissions(PermissionCode.CRM_MANAGE)
  @AuditAction({
    eventType: 'delete_contact_source',
    entityType: 'contact_source',
    labelField: 'name',
  })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactSourceService.remove(+id, organizationId);
  }
}
