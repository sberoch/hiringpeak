import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
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
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { CurrentUser } from '../auth/auth.decorators';
import { AuthzService } from '../auth/authz/authz.service';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { CreateTaskDto, TaskQueryParams, UpdateTaskDto } from './task.dto';
import {
  canManageTask,
  hasTaskReadAll,
  isCommercialTask,
  taskWriteViolation,
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

  private async viewer(user: { id: string | number }) {
    const userId = this.parseUserId(user);
    const codes = await this.authzService.getPermissionCodesForUser(userId);
    return { userId, codes, commercialAccess: hasCommercialAccess(codes) };
  }

  /**
   * The Task the caller manages. A Task they can't read is "not found", so
   * commercial Tasks never surface to callers without commercial access.
   */
  private async findManageable(
    id: number,
    organizationId: number,
    actor: { userId: number; codes: string[] },
  ) {
    const existing = await this.taskService.findOne(id, organizationId);
    const facts = {
      assignedTo: existing.assignedTo,
      commercial: existing.commercial,
    };
    if (existing.commercial && !hasCommercialAccess(actor.codes)) {
      throw new NotFoundException('Not found');
    }
    if (!canManageTask(facts, actor.userId, actor.codes)) {
      throw new ForbiddenException(
        'Cannot manage tasks assigned to other users',
      );
    }
    return existing;
  }

  /** Throws when the Task, as it will be after the write, breaks the access rules. */
  private async assertWritable(
    task: { assignedTo: number; commercial: boolean },
    organizationId: number,
    actor: { userId: number; codes: string[] },
  ) {
    const ownerHasCommercialAccess =
      task.assignedTo === actor.userId
        ? hasCommercialAccess(actor.codes)
        : task.commercial &&
          (await this.authzService.isCommercialUser(
            task.assignedTo,
            organizationId,
          ));
    const violation = taskWriteViolation(
      { ...task, ownerHasCommercialAccess },
      actor.userId,
      actor.codes,
    );
    if (violation) throw new ForbiddenException(violation);
  }

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.TASK_READ)
  async findAll(
    @Query() query: TaskQueryParams,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    const actor = await this.viewer(user);
    const readAll = hasTaskReadAll(actor.codes);

    if (
      !readAll &&
      query.assignedTo != null &&
      query.assignedTo !== actor.userId
    ) {
      throw new ForbiddenException('Cannot view tasks assigned to other users');
    }

    return this.taskService.findAll({
      ...query,
      organizationId,
      assignedTo: readAll ? query.assignedTo : actor.userId,
      commercialAccess: actor.commercialAccess,
    });
  }

  @ApiOkResponse()
  @Get('open-count')
  @Permissions(PermissionCode.TASK_READ)
  async openCount(
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.taskService.openCountFor(
      organizationId,
      await this.viewer(user),
    );
  }

  @ApiOkResponse()
  @Get('due-soon')
  @Permissions(PermissionCode.TASK_READ)
  async dueSoon(
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.taskService.dueSoonForUser(
      organizationId,
      await this.viewer(user),
    );
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
    const actor = await this.viewer(user);
    await this.assertWritable(
      {
        assignedTo: createTaskDto.assignedTo,
        commercial: isCommercialTask(createTaskDto),
      },
      organizationId,
      actor,
    );

    return this.taskService.create({
      ...createTaskDto,
      organizationId,
      createdBy: actor.userId,
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
    const actor = await this.viewer(user);
    const existing = await this.findManageable(+id, organizationId, actor);

    // Removing the Opportunity or Contact by editing doesn't set the mark.
    await this.assertWritable(
      {
        assignedTo: updateTaskDto.assignedTo ?? existing.assignedTo,
        commercial: isCommercialTask({
          opportunityIds:
            updateTaskDto.opportunityIds ?? existing.opportunityIds,
          contactIds: updateTaskDto.contactIds ?? existing.contactIds,
          stayedCommercial: existing.stayedCommercial,
        }),
      },
      organizationId,
      actor,
    );

    return this.taskService.update(+id, {
      ...updateTaskDto,
      organizationId,
      actorUserId: actor.userId,
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
    const actor = await this.viewer(user);
    await this.findManageable(+id, organizationId, actor);

    return this.taskService.complete(+id, organizationId, actor.userId);
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
    const actor = await this.viewer(user);
    await this.findManageable(+id, organizationId, actor);

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
    const actor = await this.viewer(user);
    await this.findManageable(+id, organizationId, actor);

    return this.taskService.remove(+id, organizationId);
  }
}
