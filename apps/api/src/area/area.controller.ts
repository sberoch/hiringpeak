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
import { ClsService } from 'nestjs-cls';
import { OrganizationId } from 'src/auth/organization/organization.decorator';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { CurrentUserStore } from '../auth/auth.currentuser.store';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { AreaQueryParamsDto, CreateAreaDto, UpdateAreaDto } from './area.dto';
import { AreaService } from './area.service';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Areas')
@Controller('area')
export class AreaController {
  constructor(
    private readonly areaService: AreaService,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: AreaQueryParamsDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.AREA_MANAGE)
  @AuditAction({ eventType: 'create_area', entityType: 'area' })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createAreaDto: CreateAreaDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.create(createAreaDto, organizationId);
  }

  @Permissions(PermissionCode.AREA_MANAGE)
  @AuditAction({ eventType: 'update_area', entityType: 'area' })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.update(+id, updateAreaDto, organizationId);
  }

  @Permissions(PermissionCode.AREA_MANAGE)
  @AuditAction({ eventType: 'delete_area', entityType: 'area' })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.areaService.remove(+id, organizationId);
  }
}
