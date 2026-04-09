import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
import { CurrentUser } from '../auth/auth.decorators';
import type { CurrentUserStore } from '../auth/auth.currentuser.store';
import { FeatureFlag } from '../feature-flag/feature-flag.enum';
import { FeatureFlagGuard } from '../feature-flag/feature-flag.guard';
import { RequireFeatureFlags } from '../feature-flag/feature-flag.decorator';
import { VacancyAiService } from './vacancy-ai.service';
import { CreateAiVacancyDto, ExtractVacancyAiDto } from './vacancy-ai.dto';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Vacancies')
@Controller('vacancy')
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly vacancyReportService: VacancyReportService,
    private readonly vacancyAiService: VacancyAiService,
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

  @ApiCreatedResponse()
  @Post('ai/extract')
  @UseGuards(FeatureFlagGuard)
  // @RequireFeatureFlags([FeatureFlag.AI_VACANCY_FLOW])
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async extractWithAi(
    @Body() extractVacancyAiDto: ExtractVacancyAiDto,
    @CurrentUser() user: CurrentUserStore['user'],
    @OrganizationId() organizationId: number,
  ) {
    Logger.warn('ESTOY ACA_>>>>>>>>>>>>>>');
    const userId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

    return this.vacancyAiService.extract({
      ...extractVacancyAiDto,
      organizationId,
      userId,
    });
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_vacancy', entityType: 'vacancy' })
  @Post('ai/create')
  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlags([FeatureFlag.AI_VACANCY_FLOW])
  @Permissions(PermissionCode.VACANCY_MANAGE)
  async createWithAi(
    @Body() createAiVacancyDto: CreateAiVacancyDto,
    @CurrentUser() user: CurrentUserStore['user'],
    @OrganizationId() organizationId: number,
  ) {
    const createdBy =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

    return this.vacancyAiService.create({
      ...createAiVacancyDto,
      organizationId,
      createdBy,
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
