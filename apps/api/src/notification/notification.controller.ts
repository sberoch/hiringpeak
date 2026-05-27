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
  constructor(private readonly notificationService: NotificationService) {}

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
    return this.notificationService.unreadCount(
      organizationId,
      recipientUserId,
    );
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
    return this.notificationService.markRead(
      +id,
      organizationId,
      recipientUserId,
    );
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
    return this.notificationService.dismiss(
      +id,
      organizationId,
      recipientUserId,
    );
  }
}
