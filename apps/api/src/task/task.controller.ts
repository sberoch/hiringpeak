import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { CreateTaskDto, TaskQueryParams, UpdateTaskDto } from './task.dto';
import {
  canAssignTaskTo,
  canManageTask,
  hasTaskReadAll,
} from './task-access';
import { TaskService } from './task.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Tasks')
@Controller('task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly authzService: AuthzService,
  ) {}

  private parseUserId(user: { id: string | number }): number {
    return typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
  }

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.TASK_READ)
  async findAll(
    @Query() query: TaskQueryParams,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const actorUserId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(actorUserId);
    const readAll = hasTaskReadAll(codes);

    if (
      !readAll &&
      query.assignedTo != null &&
      query.assignedTo !== actorUserId
    ) {
      throw new ForbiddenException('Cannot view tasks assigned to other users');
    }

    return this.taskService.findAll({
      ...query,
      organizationId,
      assignedTo: readAll ? query.assignedTo : actorUserId,
    });
  }

  @ApiOkResponse()
  @Get('open-count')
  @Permissions(PermissionCode.TASK_READ)
  async openCount(
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const ownerUserId = this.parseUserId(user);
    return this.taskService.openCountFor(organizationId, ownerUserId);
  }

  @ApiOkResponse()
  @Get('due-soon')
  @Permissions(PermissionCode.TASK_READ)
  async dueSoon(
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const ownerUserId = this.parseUserId(user);
    return this.taskService.dueSoonForUser(organizationId, ownerUserId);
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
    const actorUserId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(actorUserId);
    if (
      !canAssignTaskTo(createTaskDto.assignedTo, actorUserId, codes)
    ) {
      throw new ForbiddenException(
        'Cannot create tasks assigned to other users',
      );
    }

    return this.taskService.create({
      ...createTaskDto,
      organizationId,
      createdBy: actorUserId,
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
    const actorUserId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(actorUserId);
    const existing = await this.taskService.findOne(+id, organizationId);

    if (!canManageTask(existing.assignedTo, actorUserId, codes)) {
      throw new ForbiddenException('Cannot manage tasks assigned to other users');
    }

    if (
      updateTaskDto.assignedTo !== undefined &&
      !canAssignTaskTo(updateTaskDto.assignedTo, actorUserId, codes)
    ) {
      throw new ForbiddenException(
        'Cannot reassign tasks to other users',
      );
    }

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
    const actorUserId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(actorUserId);
    const existing = await this.taskService.findOne(+id, organizationId);

    if (!canManageTask(existing.assignedTo, actorUserId, codes)) {
      throw new ForbiddenException('Cannot manage tasks assigned to other users');
    }

    return this.taskService.complete(+id, organizationId, actorUserId);
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
    @CurrentUser() user: { id: string | number },
  ) {
    const actorUserId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(actorUserId);
    const existing = await this.taskService.findOne(+id, organizationId);

    if (!canManageTask(existing.assignedTo, actorUserId, codes)) {
      throw new ForbiddenException('Cannot manage tasks assigned to other users');
    }

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
    @CurrentUser() user: { id: string | number },
  ) {
    const actorUserId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(actorUserId);
    const existing = await this.taskService.findOne(+id, organizationId);

    if (!canManageTask(existing.assignedTo, actorUserId, codes)) {
      throw new ForbiddenException('Cannot manage tasks assigned to other users');
    }

    return this.taskService.remove(+id, organizationId);
  }
}
