import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PermissionCode } from '@workspace/shared/enums';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';
import { AuthzService } from '../auth/authz/authz.service';
import { CurrentUser } from '../auth/auth.decorators';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { NotificationQueryParams } from './notification.dto';
import { NotificationService } from './notification.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Notifications')
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly authzService: AuthzService,
  ) {}

  private async commercialAccess(userId: number): Promise<boolean> {
    return hasCommercialAccess(
      await this.authzService.getPermissionCodesForUser(userId),
    );
  }

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.TASK_READ)
  async findAll(
    @Query() query: NotificationQueryParams,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const recipientUserId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.notificationService.findAll({
      ...query,
      organizationId,
      recipientUserId,
      commercialAccess: await this.commercialAccess(recipientUserId),
    });
  }

  @ApiOkResponse()
  @Get('unread-count')
  @Permissions(PermissionCode.TASK_READ)
  async unreadCount(
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const recipientUserId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.notificationService.unreadCount(organizationId, {
      userId: recipientUserId,
      commercialAccess: await this.commercialAccess(recipientUserId),
    });
  }

  @ApiOkResponse()
  @Post(':id/read')
  @Permissions(PermissionCode.TASK_READ)
  async markRead(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const recipientUserId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.notificationService.markRead(+id, organizationId, {
      userId: recipientUserId,
      commercialAccess: await this.commercialAccess(recipientUserId),
    });
  }

  @ApiOkResponse()
  @Delete(':id')
  @Permissions(PermissionCode.TASK_READ)
  async dismiss(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const recipientUserId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.notificationService.dismiss(+id, organizationId, {
      userId: recipientUserId,
      commercialAccess: await this.commercialAccess(recipientUserId),
    });
  }
}
