import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
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
import { AuthzService } from '../auth/authz/authz.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthzService))
    private readonly authzService: AuthzService,
  ) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.USER_MANAGE, PermissionCode.USER_READ)
  @Get()
  async findAll(
    @Query() query: UserQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.findAll({ ...query, organizationId });
  }

  /** Users who can own commercial records (Opportunity, Account, Contact owners). */
  @ApiOkResponse()
  @Permissions(PermissionCode.CRM_READ, PermissionCode.CRM_MANAGE)
  @Get('commercial')
  async findCommercial(@OrganizationId() organizationId: number) {
    return this.authzService.listCommercialUsers(organizationId);
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
  @AuditAction({ eventType: 'create_user', entityType: 'user', labelField: 'name' })
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.create(createUserDto, organizationId);
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.USER_MANAGE)
  @AuditAction({ eventType: 'update_user', entityType: 'user', labelField: 'name' })
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
  @AuditAction({ eventType: 'delete_user', entityType: 'user', labelField: 'name' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.userService.remove(+id, organizationId);
  }
}
