import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { VacancyService } from './vacancy.service';
import {
  CreateVacancyDto,
  UpdateVacancyDto,
  VacancyQueryParams,
} from './vacancy.dto';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { VacancyReportService } from './vacancy-report.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Vacancies')
@Controller('vacancy')
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly vacancyReportService: VacancyReportService,
  ) {}

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.VACANCY_READ)
  async findAll(
    @Query() query: VacancyQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  @Permissions(PermissionCode.VACANCY_READ)
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.findOne(+id, organizationId);
  }

  @ApiOkResponse()
  @Get(':id/report/pdf')
  @Permissions(PermissionCode.VACANCY_READ)
  @ApiProduces('application/pdf')
  async downloadReport(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
    @Res() response: Response,
  ) {
    const report = await this.vacancyReportService.generateVacancyReportPdf(
      +id,
      organizationId,
    );

    response.set({
      'Content-Type': report.contentType,
      'Content-Disposition': `attachment; filename="${report.fileName}"`,
      'Content-Length': report.buffer.length.toString(),
    });

    response.status(200).end(
      report.buffer,
      'binary',
    );
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_vacancy', entityType: 'vacancy' })
  @Post()
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async create(
    @Body() createVacancyDto: CreateVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.create({
      ...createVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'update_vacancy', entityType: 'vacancy' })
  @Patch(':id')
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() updateVacancyDto: UpdateVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.update(+id, {
      ...updateVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'delete_vacancy', entityType: 'vacancy' })
  @Delete(':id')
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.remove(+id, organizationId);
  }
}
