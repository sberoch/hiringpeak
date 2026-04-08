import {
  BadRequestException,
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
import { CompanyService } from './company.service';
import { CompanyReportService } from './company-report.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyQueryParams,
} from './company.dto';
import { PermissionCode } from '@workspace/shared/enums';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Companies')
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly companyReportService: CompanyReportService,
  ) {}

  @ApiOkResponse()
  @Permissions(PermissionCode.COMPANY_READ)
  @Get()
  async findAll(
    @Query() query: CompanyQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.companyService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Permissions(PermissionCode.COMPANY_READ)
  @ApiProduces('application/pdf')
  @Get(':id/report/pdf')
  async downloadReport(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
    @Res() response: Response,
  ) {
    const report = await this.companyReportService.generateCompanyReportPdf(
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

  @ApiOkResponse()
  @Permissions(PermissionCode.COMPANY_READ)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.companyService.findOne(+id, organizationId);
  }

  @ApiCreatedResponse()
  @AuditAction({ eventType: 'create_company', entityType: 'company' })
  @Permissions(PermissionCode.COMPANY_MANAGE)
  @Post()
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @OrganizationId() organizationId: number,
  ) {
    if (organizationId == null) {
      throw new BadRequestException('Organization context required');
    }

    return this.companyService.create({
      ...createCompanyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'update_company', entityType: 'company' })
  @Permissions(PermissionCode.COMPANY_MANAGE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @OrganizationId() organizationId: number,
  ) {
    if (organizationId == null) {
      throw new BadRequestException('Organization context required');
    }

    return this.companyService.update(+id, {
      ...updateCompanyDto,
      organizationId,
    });
  }

  @ApiOkResponse()
  @AuditAction({ eventType: 'delete_company', entityType: 'company' })
  @Permissions(PermissionCode.COMPANY_MANAGE)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.companyService.remove(+id, organizationId);
  }
}
