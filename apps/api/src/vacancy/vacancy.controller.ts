import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit-log/audit-action.decorator';
import { VacancyService } from './vacancy.service';
import {
  CloseVacancyDto,
  CreateVacancyDto,
  ReopenVacancyDto,
  UpdateVacancyDto,
  VacancyQueryParams,
  VacancyListReportQueryParams,
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
  @Get('report/pdf')
  @Permissions(PermissionCode.VACANCY_READ)
  @ApiProduces('application/pdf')
  async downloadListReport(
    @Query() query: VacancyListReportQueryParams,
    @OrganizationId() organizationId: number,
  ): Promise<StreamableFile> {
    const report = await this.vacancyReportService.generateVacancyListReportPdf(
      { ...query, organizationId },
    );

    return new StreamableFile(report.buffer, {
      type: report.contentType,
      disposition: `attachment; filename="${report.fileName}"`,
      length: report.buffer.length,
    });
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
  ): Promise<StreamableFile> {
    const report = await this.vacancyReportService.generateVacancyReportPdf(
      +id,
      organizationId,
    );

    return new StreamableFile(report.buffer, {
      type: report.contentType,
      disposition: `attachment; filename="${report.fileName}"`,
      length: report.buffer.length,
    });
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_vacancy', entityType: 'vacancy', labelField: 'title' })
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
  @AuditAction({ eventType: 'update_vacancy', entityType: 'vacancy', labelField: 'title' })
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
  @AuditAction({
    eventType: 'close_vacancy',
    entityType: 'vacancy',
    labelField: 'title',
    relatedFields: [
      { type: 'close_date_from', field: 'closeChange.from' },
      { type: 'close_date_to', field: 'closeChange.to' },
    ],
  })
  @Post(':id/close')
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async close(
    @Param('id') id: string,
    @Body() closeVacancyDto: CloseVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.close(+id, {
      ...closeVacancyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({
    eventType: 'reopen_vacancy',
    entityType: 'vacancy',
    labelField: 'title',
    relatedFields: [{ type: 'close_date_from', field: 'closeChange.from' }],
  })
  @Post(':id/reopen')
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async reopen(
    @Param('id') id: string,
    @Body() reopenVacancyDto: ReopenVacancyDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.reopen(
      +id,
      organizationId,
      reopenVacancyDto.statusId,
    );
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'delete_vacancy', entityType: 'vacancy', labelField: 'title' })
  @Delete(':id')
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyService.remove(+id, organizationId);
  }
}
