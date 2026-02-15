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
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { SeniorityService } from './seniority.service';
import {
  CreateSeniorityDto,
  UpdateSeniorityDto,
  SeniorityQueryParams,
} from './seniority.dto';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Seniorities')
@Controller('seniority')
export class SeniorityController {
  constructor(private readonly seniorityService: SeniorityService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: SeniorityQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createSeniorityDto: CreateSeniorityDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.create({
      ...createSeniorityDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSeniorityDto: UpdateSeniorityDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.update(+id, {
      ...updateSeniorityDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.seniorityService.remove(+id, organizationId);
  }
}
