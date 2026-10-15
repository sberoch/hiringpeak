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
import { AuthzService } from '../auth/authz/authz.service';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import {
  ContactActor,
  ContactDuplicatesQuery,
  ContactQueryParams,
  CreateContactDto,
  UpdateContactDto,
} from './contact.dto';
import { ContactService } from './contact.service';

/**
 * The Organization's network (list, Contact page) is commercial-only
 * (CRM_READ or CRM_MANAGE). Contacts are created, edited and deleted with
 * COMPANY_MANAGE or CRM_MANAGE (see canManageContacts); without commercial
 * access only a Company's Contacts and their basic fields can be written
 * (see networkFieldViolation). A Company's Contacts are also read through the
 * Company endpoints, shaped for the caller.
 */
@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Contacts')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly authzService: AuthzService,
  ) {}

  private async actor(
    user: { id: string | number },
    organizationId: number,
  ): Promise<ContactActor> {
    const userId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const codes = await this.authzService.getPermissionCodesForUser(userId);
    return { organizationId, userId, codes };
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(
    @Query() query: ContactQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactService.findAll({ ...query, organizationId });
  }

  /** Probable duplicates of a Contact being typed in (warning only). */
  @ApiOkResponse()
  @Permissions(PermissionCode.COMPANY_MANAGE, PermissionCode.CRM_MANAGE)
  @Get('duplicates')
  async findDuplicates(
    @Query() query: ContactDuplicatesQuery,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.contactService.findDuplicates(
      query,
      await this.actor(user, organizationId),
    );
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.contactService.findOne(+id, organizationId);
  }

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
    return this.contactService.create(
      dto,
      await this.actor(user, organizationId),
    );
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
    @CurrentUser() user: { id: string | number },
  ) {
    return this.contactService.update(
      +id,
      dto,
      await this.actor(user, organizationId),
    );
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
    @CurrentUser() user: { id: string | number },
  ) {
    return this.contactService.remove(
      +id,
      await this.actor(user, organizationId),
    );
  }
}
