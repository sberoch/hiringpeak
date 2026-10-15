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
  CreateInteractionDto,
  InteractionActor,
  InteractionQueryParams,
  UpdateInteractionDto,
} from './interaction.dto';
import { InteractionService } from './interaction.service';

/**
 * Interactions are commercial-side only: CRM_READ or CRM_MANAGE read them,
 * only CRM_MANAGE logs, edits or deletes them.
 */
@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Interactions')
@Controller('interaction')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  private actor(
    user: { id: string | number },
    organizationId: number,
  ): InteractionActor {
    const userId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return { organizationId, userId };
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get()
  async findAll(
    @Query() query: InteractionQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.interactionService.findAll(query, organizationId);
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.interactionService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @AuditAction({
    eventType: 'create_interaction',
    entityType: 'interaction',
    labelField: 'summary',
  })
  @Permissions(PermissionCode.CRM_MANAGE)
  @Post()
  async create(
    @Body() dto: CreateInteractionDto,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.interactionService.create(
      dto,
      this.actor(user, organizationId),
    );
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'update_interaction',
    entityType: 'interaction',
    labelField: 'summary',
  })
  @Permissions(PermissionCode.CRM_MANAGE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInteractionDto,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.interactionService.update(
      +id,
      dto,
      this.actor(user, organizationId),
    );
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'delete_interaction',
    entityType: 'interaction',
    labelField: 'summary',
  })
  @Permissions(PermissionCode.CRM_MANAGE)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.interactionService.remove(+id, organizationId);
  }
}
