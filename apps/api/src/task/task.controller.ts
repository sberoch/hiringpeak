import {
  Body,
  Controller,
  Get,
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
import { CreateTaskDto, TaskQueryParams } from './task.dto';
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
}
