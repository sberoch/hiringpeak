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
import { CreateTaskDto, TaskQueryParams, UpdateTaskDto } from './task.dto';
import { TaskService } from './task.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Tasks')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.TASK_READ)
  async findAll(
    @Query() query: TaskQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.taskService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get('open-count')
  @Permissions(PermissionCode.TASK_READ)
  async openCount(
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const ownerUserId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.taskService.openCountFor(organizationId, ownerUserId);
  }

  @ApiCreatedResponse()
  @AuditAction({
    eventType: 'create_task',
    entityType: 'task',
    labelField: 'title',
  })
  @Post()
  @Permissions(PermissionCode.TASK_MANAGE)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const createdBy =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.taskService.create({
      ...createTaskDto,
      organizationId,
      createdBy,
    });
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'update_task',
    entityType: 'task',
    labelField: 'title',
  })
  @Patch(':id')
  @Permissions(PermissionCode.TASK_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const actorUserId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.taskService.update(+id, {
      ...updateTaskDto,
      organizationId,
      actorUserId,
    });
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'complete_task',
    entityType: 'task',
    labelField: 'title',
  })
  @Post(':id/complete')
  @Permissions(PermissionCode.TASK_MANAGE)
  async complete(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const completedBy =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return this.taskService.complete(+id, organizationId, completedBy);
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'reopen_task',
    entityType: 'task',
    labelField: 'title',
  })
  @Post(':id/reopen')
  @Permissions(PermissionCode.TASK_MANAGE)
  async reopen(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.taskService.reopen(+id, organizationId);
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'delete_task',
    entityType: 'task',
    labelField: 'title',
  })
  @Delete(':id')
  @Permissions(PermissionCode.TASK_MANAGE)
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.taskService.remove(+id, organizationId);
  }
}
