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
import { VacancyStatusService } from './vacancystatus.service';
import {
  CreateVacancyStatusDto,
  UpdateVacancyStatusDto,
  VacancyStatusQueryParams,
} from './vacancystatus.dto';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('VacancyStatuses')
@Controller('vacancyStatus')
export class VacancyStatusController {
  constructor(
    private readonly vacancyStatusService: VacancyStatusService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: VacancyStatusQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.VACANCY_MANAGE)
  @AuditAction({ eventType: 'create_vacancy_status', entityType: 'vacancy_status' })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createVacancyStatusDto: CreateVacancyStatusDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.create({
      ...createVacancyStatusDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.VACANCY_MANAGE)
  @AuditAction({ eventType: 'update_vacancy_status', entityType: 'vacancy_status' })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyStatusDto: UpdateVacancyStatusDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.update(+id, {
      ...updateVacancyStatusDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.VACANCY_MANAGE)
  @AuditAction({ eventType: 'delete_vacancy_status', entityType: 'vacancy_status' })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.remove(+id, organizationId);
  }
}
