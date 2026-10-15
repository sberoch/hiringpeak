import {
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from '../auth/auth.decorators';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { CreateContactDto, UpdateContactDto } from './contact.dto';
import { ContactService } from './contact.service';

/**
 * Contacts are created, edited and deleted with COMPANY_MANAGE or CRM_MANAGE
 * (see canManageContacts). A Company's Contacts are read through the Company
 * endpoints, shaped for the caller.
 */
@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Contacts')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiCreatedResponse()
  @AuditAction({
    eventType: 'create_contact',
    entityType: 'contact',
    labelField: 'name',
  })
  @Permissions(PermissionCode.COMPANY_MANAGE, PermissionCode.CRM_MANAGE)
  @Post()
  async create(
    @Body() dto: CreateContactDto,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const createdBy =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.contactService.create({ ...dto, organizationId, createdBy });
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'update_contact',
    entityType: 'contact',
    labelField: 'name',
  })
  @Permissions(PermissionCode.COMPANY_MANAGE, PermissionCode.CRM_MANAGE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactService.update(+id, { ...dto, organizationId });
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'delete_contact',
    entityType: 'contact',
    labelField: 'name',
  })
  @Permissions(PermissionCode.COMPANY_MANAGE, PermissionCode.CRM_MANAGE)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactService.remove(+id, organizationId);
  }
}
