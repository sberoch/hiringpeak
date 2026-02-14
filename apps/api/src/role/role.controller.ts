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
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { CreateRoleDto, RoleQueryParams, UpdateRoleDto } from './role.dto';
import { RoleService } from './role.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Roles')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.ROLE_MANAGE)
  async findAll(
    @Query() query: RoleQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.roleService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  @Permissions(PermissionCode.ROLE_MANAGE)
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.roleService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @Post()
  @Permissions(PermissionCode.ROLE_MANAGE)
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.roleService.create(createRoleDto, organizationId);
  }

  @ApiOkResponse()
  @Patch(':id')
  @Permissions(PermissionCode.ROLE_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.roleService.update(+id, updateRoleDto, organizationId);
  }

  @ApiOkResponse()
  @Delete(':id')
  @Permissions(PermissionCode.ROLE_MANAGE)
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.roleService.remove(+id, organizationId);
  }
}
