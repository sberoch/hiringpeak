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
import { AuditAction } from '../audit-log/audit-action.decorator';
import { IndustryService } from './industry.service';
import {
  CreateIndustryDto,
  UpdateIndustryDto,
  IndustryQueryParams,
} from './industry.dto';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('Industries')
@Controller('industry')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: IndustryQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'create_industry', entityType: 'industry' })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createIndustryDto: CreateIndustryDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.create({
      ...createIndustryDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'update_industry', entityType: 'industry' })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIndustryDto: UpdateIndustryDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.update(+id, {
      ...updateIndustryDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'delete_industry', entityType: 'industry' })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.industryService.remove(+id, organizationId);
  }
}
