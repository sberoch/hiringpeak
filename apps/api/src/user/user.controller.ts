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
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { CreateUserDto, UpdateUserDto, UserQueryParams } from './user.dto';
import { UserService } from './user.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.USER_MANAGE, PermissionCode.USER_READ)
  @Get()
  async findAll(
    @Query() query: UserQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Permissions(PermissionCode.USER_MANAGE)
  @AuditAction({ eventType: 'create_user', entityType: 'user' })
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.create(createUserDto, organizationId);
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.USER_MANAGE)
  @AuditAction({ eventType: 'update_user', entityType: 'user' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.update(+id, updateUserDto, organizationId);
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.USER_MANAGE)
  @AuditAction({ eventType: 'delete_user', entityType: 'user' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.remove(+id, organizationId);
  }
}
